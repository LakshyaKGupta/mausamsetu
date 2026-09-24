import React from 'react'
import { Navigate } from 'react-router-dom'

export default function OfficerLogin() {
  // Officer login has been replaced by District Admin login
  return <Navigate to="/login?role=admin" replace />
}
