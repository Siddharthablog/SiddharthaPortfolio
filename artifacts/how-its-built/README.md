# Portfolio Website - Siddhartha Mani

A modern, animated portfolio website showcasing technical writing experience, built with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies (from project root)
pnpm install --ignore-scripts

# Navigate to the portfolio directory
cd artifacts/how-its-built

# Start development server (option 1: using script)
./dev.sh

# OR (option 2: using pnpm directly)
pnpm run dev
```

The site will be available at http://localhost:5173/

### Build for Production

```bash
cd artifacts/how-its-built
pnpm run build
```

The built files will be in `dist/public/`

## 📦 What's Inside

- **React 19** - Latest React with modern features
- **Vite 7** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first CSS framework
- **TypeScript** - Type-safe development
- **Framer Motion** - Smooth animations
- **Custom UI Components** - Reusable component library

## 🎨 Features

- ✨ Smooth scroll animations
- 📱 Fully responsive design
- 🎯 Interactive capability cards
- 🔄 Animated skill tags
- 📊 Dynamic experience timeline
- 🎭 Professional animations throughout

## 🌐 Deploy to Production

### Vercel (Recommended - Easiest)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy! (Configuration is automatic via `vercel.json`)

Your site will be live at `https://your-project.vercel.app`

### Other Platforms

See [DEPLOYMENT.md](../../DEPLOYMENT.md) in the root directory for detailed instructions on deploying to:
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🛠️ Configuration

### Environment Variables

The project uses these environment variables (with defaults):

- `PORT` - Development server port (default: 5173)
- `BASE_PATH` - Application base path (default: /)

These are automatically set via the `.env` file for local development.

### Customization

To customize the portfolio content, edit:
- `src/App.tsx` - Main portfolio content and data
- `src/index.css` - Global styles and CSS variables

## 📁 Project Structure

```
artifacts/how-its-built/
├── src/
│   ├── App.tsx              # Main portfolio component
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   └── components/          # Reusable UI components
├── public/                  # Static assets
├── .env                     # Environment variables
├── .env.example             # Environment template
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies
└── README.md                # This file
```

## 🔧 Troubleshooting

### Issue: Port already in use
Change the PORT in `.env` file to a different number (e.g., 5174)

### Issue: Dependencies fail to install
Use: `pnpm install --no-frozen-lockfile --ignore-scripts`

### Issue: Build fails
Make sure you're in the correct directory: `cd artifacts/how-its-built`

## 📝 License

MIT

## 👤 Author

**Siddhartha Mani**
- Email: mani.siddhartha@gmail.com
- LinkedIn: [siddhartha-mani](https://www.linkedin.com/in/siddhartha-mani-98696073/)
- GitHub: [Siddharthablog](https://github.com/Siddharthablog)

---

Built with ❤️ using React + Vite + Tailwind CSS