# Real-Time Chat & Video Call Application

A high-performance, modern chat application built with **Next.js**, **Socket.IO**, and **Redis**. This application supports real-time messaging, image sharing via Cloudinary, and high-quality audio/video calls using WebRTC.

## 🚀 Features

-   **Real-Time Messaging**: Instant message delivery using custom Socket.IO signaling.
-   **Audio & Video Calls**: P2P communication powered by WebRTC with automatic ICE candidate queueing for reliability.
-   **Image Sharing**: Seamless image uploads and optimization using Cloudinary.
-   **Redis Integration**: Fast data caching and messaging persistence using Upstash Redis.
-   **User Authentication**: Secure login and management via Kinde Auth.
-   **Responsive Design**: A premium, mobile-first UI with vertical video layouts for smaller screens and side-by-side views for desktop.
-   **State Management**: Optimized client-side state using Zustand and TanStack Query.
-   **Theming**: Full support for Dark Mode and custom aesthetics.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 16 (App Router), Tailwind CSS, Framer Motion, Radix UI.
-   **Backend**: Node.js Express server for WebSockets.
-   **Database**: Upstash Redis (Serverless Redis).
-   **Real-time & Media**: Socket.IO, WebRTC API.
-   **Auth**: Kinde OSS.
-   **Storage**: Cloudinary.

## 🏃 Getting Started

### 1. Prerequisite Environments
Create a `.env` file in the root directory with the following keys:
```env
# Kinde Auth
KINDE_CLIENT_ID=your_id
KINDE_CLIENT_SECRET=your_secret
KINDE_ISSUER_URL=your_url
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Socket Server
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Application
You need to run both the Next.js development server and the WebSocket server.

**Terminal 1 (Next.js):**
```bash
npm run dev
```

**Terminal 2 (WebSocket Server):**
```bash
npm run socket
```

## 🏗️ Project Structure

-   `/src/actions`: Server actions for database and broadcast logic.
-   `/src/components/Chat`: Core chat components (TopBar, BottomBar, MessageList).
-   `/server.js`: The custom Express + Socket.IO server for WebRTC signaling and broadcasting.
-   `/src/store`: Zustand stores for global application state.
-   `/src/lib`: Shared utilities, database, and socket clients.

## 🔒 Security
The application uses Kinde for secure authentication. User data and chat logic are protected via server-side verification in Next.js actions.

## 📄 License
MIT
