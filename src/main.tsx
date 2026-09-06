import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router'
import { App } from './App'
import './index.css'

// 1. Initialize Convex Client
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://disciplined-greyhound-279.eu-west-1.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

// 2. Setup TanStack Router Root and Routes
const rootRoute = createRootRoute({
  component: () => (
    <ConvexProvider client={convex}>
      <Outlet />
    </ConvexProvider>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
})

const routeTree = rootRoute.addChildren([indexRoute])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// 3. Mount Application
const rootElement = document.getElementById('root')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}
