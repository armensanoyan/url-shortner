# URL Shortener Frontend

A modern, minimalistic URL shortener built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔗 **URL Shortening**: Create short, memorable links from long URLs
- 👤 **User Authentication**: Register and login to manage your URLs
- 📋 **Copy to Clipboard**: One-click copying of shortened URLs
- 🎨 **Custom Slugs**: Optionally specify your own custom slug
- 📊 **URL Management**: View, delete, and track your shortened URLs
- 🌙 **Dark Mode**: Automatic dark mode support
- 📱 **Responsive Design**: Works perfectly on all devices
- ⚡ **Real-time Validation**: Instant URL validation and error feedback

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Backend API running on `http://localhost:3001`

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` if your backend runs on a different port:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Register/Login**: Create an account or login to start shortening URLs
2. **Shorten URLs**: Enter a long URL and optionally specify a custom slug
3. **Manage URLs**: View all your shortened URLs, copy them, or delete them
4. **Track Performance**: See click counts for your shortened URLs

## API Integration

The frontend connects to the backend API with the following endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `POST /api/urls` - Create shortened URL
- `GET /api/urls` - Get user's URLs
- `DELETE /api/urls/:id` - Delete URL

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with Toaster
│   ├── page.tsx        # Main URL shortener interface
│   ├── not-found.tsx   # 404 page for invalid slugs
│   └── globals.css     # Global styles
```

## Features Implemented

✅ **Core Requirements**:
- React application with URL input form
- Shortened URL generation and storage
- Unique slug generation
- URL redirection functionality
- 404 page for invalid slugs
- List of all saved URLs

✅ **Extra Credit Features**:
- User authentication (register/login)
- URL validation with error messages
- Copy to clipboard functionality
- Custom slug modification
- Visit tracking (clicks display)
- Rate limiting (backend)
- Dashboard showing URL popularity
- Docker support (see Dockerfile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of a technical assessment for URL shortener functionality.
