---
title: MSTP Finetune Bot
emoji: 📝
colorFrom: purple
colorTo: indigo
sdk: gradio
sdk_version: "5.31.0"
app_file: app.py
pinned: false
license: apache-2.0
---

# MSTP Finetune Bot

A Llama 3.2 3B model fine-tuned on Microsoft Technical Publications (MSTP)
style guide data using Unsloth QLoRA.

## API Usage

This Space exposes a Gradio API. You can call it programmatically:

```bash
# Step 1: Submit
curl -X POST "https://Siddhartha03-mstp-finetune-bot.hf.space/gradio_api/call/chat" \
  -H "Content-Type: application/json" \
  -d '{"data": ["your question here", []]}'

# Step 2: Get result (use the event_id from step 1)
curl -N "https://Siddhartha03-mstp-finetune-bot.hf.space/gradio_api/call/chat/<EVENT_ID>"
```
