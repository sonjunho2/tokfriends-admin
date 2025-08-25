'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export default function BannedWordsPage() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [severity, setSeverity] = useState('MEDIUM')
  const [note, setNote] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchWords()
  }, [])

  const fetchWords = async () => {
    setLoading(true)
    try {
      const response = await api.get('/banned-words')
      setWords(response.data)
    } catch (error) {
      toast({
        title: '오류',
        description: '금칙어 목록을 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await api.post('/banned-words', {
        word: newWord,
        severity,
        note
      })
      toast({
        title: '성공',
        description: '금칙어가 추가되었습니다.',
      })
      setDialogOpen(false)
      setNewWord('')
      setNote('')
      fetchWords()
    } catch (error) {
      toast({
        title: '오류',
        description: '금칙어 추가에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/banned-words/${id}`)
      toast({
        title: '성공',
        description: '금칙어가 삭제되었습니다.',
      })
      fetchWords()
    } catch (error) {
      toast({
        title: '오류',
        description: '금칙어 삭제에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const columns = [
    { key: 'word', label: '금칙어' },
    { key: 'severity', label: '심각도' },
    { key: 'note', label: '메모' },
    { key: 'createdAt', label: '등록일' },
    {
      key: 'actions',
      label: '액션',
      render: (word: any) => (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(word.id)}
        >
          삭제
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">금칙어 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>금칙어 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 금칙어 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="금칙어"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
              />
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">낮음</SelectItem>
                  <SelectItem value="MEDIUM">보통</SelectItem>
                  <SelectItem value="HIGH">높음</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="메모 (선택사항)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button onClick={handleAdd} className="w-full">추가</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={words}
        loading={loading}
      />
    </div>
  )
}