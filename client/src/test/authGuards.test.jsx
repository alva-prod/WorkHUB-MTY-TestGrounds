import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock useAuth so we can inject any user state without a real provider
vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/useAuth'
import RequireAdmin from '../components/auth/RequireAdmin'

function renderWithRouter(ui, { initialEntries = ['/admin'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div data-testid="home" />} />
        <Route path="/admin" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAdmin', () => {
  it('renders children when user has rolId 2 (admin)', () => {
    useAuth.mockReturnValue({ user: { rolId: 2 } })
    const { getByTestId } = renderWithRouter(
      <RequireAdmin>
        <div data-testid="admin-content" />
      </RequireAdmin>
    )
    expect(getByTestId('admin-content')).toBeTruthy()
  })

  it('redirects to / when user is null (not logged in)', () => {
    useAuth.mockReturnValue({ user: null })
    const { getByTestId } = renderWithRouter(
      <RequireAdmin>
        <div data-testid="admin-content" />
      </RequireAdmin>
    )
    expect(getByTestId('home')).toBeTruthy()
  })

  it('redirects to / when user has a non-admin role (e.g. rolId 1)', () => {
    useAuth.mockReturnValue({ user: { rolId: 1 } })
    const { getByTestId } = renderWithRouter(
      <RequireAdmin>
        <div data-testid="admin-content" />
      </RequireAdmin>
    )
    expect(getByTestId('home')).toBeTruthy()
  })

  it('redirects to / when user has rolId 5 (guard)', () => {
    useAuth.mockReturnValue({ user: { rolId: 5 } })
    const { getByTestId } = renderWithRouter(
      <RequireAdmin>
        <div data-testid="admin-content" />
      </RequireAdmin>
    )
    expect(getByTestId('home')).toBeTruthy()
  })
})
