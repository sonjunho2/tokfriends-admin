'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function RecentReports() {
  const [reports, setReports] = useState([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports', {
        params: { limit: 5, status: 'PENDING' }
      })
      setReports(