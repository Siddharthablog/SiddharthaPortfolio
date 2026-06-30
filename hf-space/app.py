"""
MSTP Fine-Tuned Chatbot API — Hugging Face Space (ZeroGPU)
Hosts Siddhartha03/mstp-Llama-3.2-3B-Instruct as a Gradio chat interface
with a programmatic API endpoint for the portfolio website.
"""

import os
import torch
import gradio as gr
from transformers import AutoModelForCausalLM, AutoTokenizer

# Conditionally import and apply spaces.GPU if available (ZeroGPU environment)
try:
    import spaces
    has_spaces = True
except ImportError:
    has_spaces = False

MODEL_ID = "Siddhartha03/mstp-Llama-3.2-3B-Instruct"

SYSTEM_PROMPT = (
    "You are a specialized technical writing assistant fine-tuned on the "
    "Microsoft Technical Publications (MSTP) guidelines. Help the user format, "
    "phrase, and structure their technical documentation according to Microsoft's "
    "style guide. Be concise, professional, and provide actionable guidance."
)

# ── Load model & tokenizer ──────────────────────────────────────────────────
# Choose bfloat16 if GPU is available, else float32 for CPU to avoid accuracy drops
device = "cuda" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch_dtype,
    device_map="auto" if torch.cuda.is_available() else None,
)
if not torch.cuda.is_available():
    model = model.to("cpu")


def gpu_decorator(func):
    if has_spaces:
        return spaces.GPU(func)
    return func


@gpu_decorator
def respond(message: str, history: list[dict]) -> str:
    """Generate a response using the fine-tuned model."""
    # Build the conversation in the format the model expects
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Include conversation history
    for turn in history:
        messages.append({"role": turn["role"], "content": turn["content"]})

    # Add the current user message
    messages.append({"role": "user", "content": message})

    # Tokenize with the chat template (explicitly return a dictionary containing input_ids and attention_mask)
    inputs = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True,
    )
    
    # Move all tensors in the dictionary to the model's device
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    # Generate using unpacked dictionary (keyword arguments)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Decode only the new tokens (skip the prompt)
    response_ids = outputs[0][inputs["input_ids"].shape[-1]:]
    answer = tokenizer.decode(response_ids, skip_special_tokens=True).strip()
    return answer


# ── Gradio Chat Interface ────────────────────────────────────────────────────
demo = gr.ChatInterface(
    fn=respond,
    type="messages",
    title="📝 MSTP Finetune Bot",
    description=(
        "A Llama 3.2 3B model fine-tuned on Microsoft Technical Publications (MSTP) "
        "style guide data. Ask about formatting, phrasing, or technical writing best practices."
    ),
    examples=[
        "Should I use 'click' or 'select' when referring to a user clicking a button?",
        "How should I format a procedure with numbered steps?",
        "What's the MSTP guideline for writing error messages?",
    ],
    theme=gr.themes.Soft(),
)

if __name__ == "__main__":
    demo.launch()
