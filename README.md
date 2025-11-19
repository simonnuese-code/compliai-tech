<div align="center">
<h1 align="center">Claude Code Starter Web</h1>

<p align="center">
    <strong>The ultimate starter template for building modern web apps with Claude Code.</strong>
  </p>

<p align="center">
    <a href="https://www.udemy.com/course/vibe-coding-101/?referralCode=B036C72872CDF04A7DF2"><strong>View Course »</strong></a>
    <br />
    <br />
    <a href="#-tech-stack">Tech Stack</a>
    ·
    <a href="#-getting-started">Getting Started</a>
    ·
    <a href="#-available-scripts">Scripts</a>
  </p>
</div>

> [!TIP]
> This template is part of the
> **[Vibe Coding 101](https://www.udemy.com/course/vibe-coding-101/?referralCode=B036C72872CDF04A7DF2)**
> course. It is **Open Source** and free to use for everyone!

This is a starter template for building modern web applications using **Claude
Code**. It comes pre-configured with a robust tech stack to help you hit the
ground running.

## 🚀 Tech Stack

This project uses the following technologies:

- **[Next.js 15](https://nextjs.org/)**: The React framework for the web (App
  Router).
- **[React 19](https://react.dev/)**: The library for web and native user
  interfaces.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: A utility-first CSS framework.
- **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed components built
  with Radix UI and Tailwind CSS.
- **[Supabase](https://supabase.com/)**: Open source Firebase alternative
  (Database, Auth, Realtime).
- **[TypeScript](https://www.typescriptlang.org/)**: Typed JavaScript for better
  developer experience.
- **[Playwright](https://playwright.dev/)**: Reliable end-to-end testing for
  modern web apps.
- **[Zod](https://zod.dev/)**: TypeScript-first schema declaration and
  validation library.
- **[React Hook Form](https://react-hook-form.com/)**: Performant, flexible and
  extensible forms with easy-to-use validation.
- **[motion](https://motion.dev/)**: A modern animation library for React
  (formerly framer-motion).

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd claude-code-starter-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` (create `.env.example` if it doesn't
     exist based on your needs, primarily for Supabase).
   - Fill in the required values in `.env.local`.

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run typecheck`: Runs TypeScript compiler to check for type errors.
- `npm run test`: Runs Playwright end-to-end tests.

## 📂 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: React components, including `ui/` for shadcn/ui components.
- `hooks/`: Custom React hooks.
- `lib/`: Utility functions and shared logic.
- `public/`: Static assets like images and fonts.
- `supabase/`: Supabase configuration and migrations.
- `tests/`: Playwright test specifications.

## 🌍 Environment Variables

This project uses Next.js environment variable conventions:

- **Server-side**: Variables without `NEXT_PUBLIC_` prefix (e.g.,
  `DATABASE_URL`) are only available on the server.
- **Client-side**: Variables with `NEXT_PUBLIC_` prefix (e.g.,
  `NEXT_PUBLIC_SUPABASE_URL`) are exposed to the browser.

**Note**: Never commit your `.env.local` file to version control.
