import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react'
import { authClient } from './lib/auth-client'
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router'
import { App } from './App'
import { LandingPage } from './pages/LandingPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { TemplatePage } from './pages/TemplatePage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import './index.css'

// 1. Initialize Convex Client
const convexUrl =
  import.meta.env.VITE_CONVEX_URL ||
  'https://disciplined-greyhound-279.eu-west-1.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

// 2. Setup TanStack Router Root and Routes with Better Auth Provider
const rootRoute = createRootRoute({
  component: () => (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as AuthClient}
    >
      <Outlet />
    </ConvexBetterAuthProvider>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-in',
  component: SignInPage,
})

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-up',
  component: SignUpPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <ProtectedRoute>
      <App initialView="dashboard" />
    </ProtectedRoute>
  ),
})

const campaignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns',
  component: () => (
    <ProtectedRoute>
      <App initialView="campaigns" />
    </ProtectedRoute>
  ),
})

const creatorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/creators',
  component: () => (
    <ProtectedRoute>
      <App initialView="creators" />
    </ProtectedRoute>
  ),
})

const pipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pipeline',
  component: () => (
    <ProtectedRoute>
      <App initialView="pipeline" />
    </ProtectedRoute>
  ),
})

const templatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/templates',
  component: () => (
    <ProtectedRoute>
      <App initialView="templates" />
    </ProtectedRoute>
  ),
})

const templateNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/templates/new',
  component: () => (
    <ProtectedRoute>
      <TemplatePage />
    </ProtectedRoute>
  ),
})

const templateDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/templates/$templateId',
  component: () => (
    <ProtectedRoute>
      <TemplatePage />
    </ProtectedRoute>
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  signUpRoute,
  dashboardRoute,
  campaignsRoute,
  creatorsRoute,
  pipelineRoute,
  templatesRoute,
  templateNewRoute,
  templateDetailRoute,
])

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
