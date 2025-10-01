+'use client'
+
+import { useMemo, useState } from 'react'
+import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
+import { Button } from '@/components/ui/button'
+import { Input } from '@/components/ui/input'
+import { Label } from '@/components/ui/label'
+import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
+import { Switch } from '@/components/ui/switch'
+import { Textarea } from '@/components/ui/textarea'
+import { useToast } from '@/components/ui/use-toast'
+
+interface ChatRoom {
+  id: string
+  title: string
+  category: string
+  region: string
+  distanceKm: number
+  unread: number
+  newMessages: number
+  participants: number
+  status: 'ACTIVE' | 'ARCHIVED' | 'NEEDS_REVIEW'
+  isFallback: boolean
+  createdAt: string
+  lastMessageAt: string
+}
+
+interface ReportItem {
+  id: string
+  roomId: string
+  reporter: string
+  reason: string
+  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
+  createdAt: string
+}
+
+const ROOMS: ChatRoom[] = [
+  {
+    id: 'ROOM001',
+    title: '서울 20대 친목방',
+    category: '친목',
+    region: '서울 강남구',
+    distanceKm: 2,
+    unread: 4,
+    newMessages: 12,
+    participants: 58,
+    status: 'ACTIVE',
+    isFallback: false,
+    createdAt: '2024-03-10 14:22',
+    lastMessageAt: '2024-03-14 11:12',
+  },
+  {
+    id: 'ROOM002',
+    title: '부산 맛집 공유',
+    category: '취향',
+    region: '부산 해운대구',
+    distanceKm: 5,
+    unread: 0,
+    newMessages: 3,
+    participants: 34,
+    status: 'ACTIVE',
+    isFallback: true,
+    createdAt: '2024-03-11 09:10',
+    lastMessageAt: '2024-03-13 22:45',
+  },
+  {
+    id: 'ROOM003',
+    title: '경기 북부 하이킹',
+    category: '액티비티',
+    region: '경기 의정부',
+    distanceKm: 18,
+    unread: 9,
+    newMessages: 21,
+    participants: 42,
+    status: 'NEEDS_REVIEW',
+    isFallback: false,
+    createdAt: '2024-03-08 19:34',
+    lastMessageAt: '2024-03-14 07:02',
+  },
+  {
+    id: 'ROOM004',
+    title: '전북 여행 정보',
+    category: '지역',
+    region: '전북 전주',
+    distanceKm: 62,
+    unread: 2,
+    newMessages: 4,
+    participants: 25,
+    status: 'ARCHIVED',
+    isFallback: false,
+    createdAt: '2024-02-28 08:44',
+    lastMessageAt: '2024-03-02 12:18',
+  },
+]
+
+const REPORTS: ReportItem[] = [
+  {
+    id: 'REP-1001',
+    roomId: 'ROOM003',
+    reporter: 'hana@example.com',
+    reason: '부적절한 언어 사용',
+    status: 'PENDING',
+    createdAt: '2024-03-14 08:12',
+  },
+  {
+    id: 'REP-1002',
+    roomId: 'ROOM002',
+    reporter: 'minsu@example.com',
+    reason: '홍보성 메시지',
+    status: 'IN_PROGRESS',
+    createdAt: '2024-03-13 15:48',
+  },
+]
+
+const STATUS_LABEL: Record<ChatRoom['status'], string> = {
+  ACTIVE: '운영 중',
+  ARCHIVED: '종료',
+  NEEDS_REVIEW: '검토 필요',
+}
+
+const SEGMENT_OPTIONS = [
+  { value: 'ALL', label: '전체' },
+  { value: 'UNREAD', label: '읽지 않음' },
+  { value: 'NEW', label: '신규' },
+  { value: 'FAVORITE', label: '즐겨찾기' },
+]
+
+type SegmentFilter = (typeof SEGMENT_OPTIONS)[number]['value']
+
+export default function ChatOpsPage() {
+  const { toast } = useToast()
+  const [rooms, setRooms] = useState(ROOMS)
+  const [segment, setSegment] = useState<SegmentFilter>('ALL')
+  const [keyword, setKeyword] = useState('')
+  const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0]?.id ?? '')
+  const [cannedResponse, setCannedResponse] = useState('')
+  const [allowEntry, setAllowEntry] = useState(true)
+
+  const filteredRooms = useMemo(() => {
+    return rooms.filter((room) => {
+      const matchKeyword =
+        keyword.trim().length === 0 ||
+        room.title.includes(keyword) ||
+        room.region.includes(keyword) ||
+        room.category.includes(keyword)
+
+      let matchSegment = true
+      if (segment === 'UNREAD') matchSegment = room.unread > 0
+      if (segment === 'NEW') matchSegment = room.newMessages > 0
+      if (segment === 'FAVORITE') matchSegment = room.participants > 40
+
+      return matchKeyword && matchSegment
+    })
+  }, [rooms, keyword, segment])
+
+  const selectedRoom = useMemo(() => {
+    const found = filteredRooms.find((room) => room.id === selectedRoomId)
+    return found ?? filteredRooms[0]
+  }, [filteredRooms, selectedRoomId])
+
+  const toggleFallback = () => {
+    if (!selectedRoom) return
+    setRooms((prev) =>
+      prev.map((room) =>
+        room.id === selectedRoom.id
+          ? {
+              ...room,
+              isFallback: !room.isFallback,
+            }
+          : room
+      )
+    )
+    toast({ title: '방 만들기 설정 변경', description: '폴백 여부가 업데이트되었습니다.' })
+  }
+
+  const updateStatus = (status: ChatRoom['status']) => {
+    if (!selectedRoom) return
+    setRooms((prev) => prev.map((room) => (room.id === selectedRoom.id ? { ...room, status } : room)))
+    toast({ title: '상태 변경', description: `${STATUS_LABEL[status]}으로 표시되었습니다.` })
+  }
+
+  const sendAnnouncement = () => {
+    if (!selectedRoom) return
+    toast({
+      title: '운영 공지 발송',
+      description: `${selectedRoom.title}에 운영자 공지를 게시했습니다.`,
+    })
+    setCannedResponse('')
+  }
+
+  const escalateReport = (reportId: string) => {
+    toast({
+      title: '신고 이관',
+      description: `${reportId} 번 신고를 커뮤니티 제재 프로세스로 이동했습니다.`,
+    })
+  }
+
+  return (
+    <div className="grid gap-6 xl:grid-cols-[3fr_4fr]">
+      <section className="space-y-4">
+        <Card>
+          <CardHeader>
+            <CardTitle>대화방 세그먼트 모니터링</CardTitle>
+            <p className="text-sm text-muted-foreground">
+              전체/읽지 않음/신규/즐겨찾기 세그먼트와 지역·거리·미확인 메시지를 기반으로 상담사가 즉시 진입할 수 있습니다.
+            </p>
+          </CardHeader>
+          <CardContent className="space-y-4">
+            <div className="flex flex-col gap-3 lg:flex-row">
+              <Input placeholder="방 제목·카테고리·지역 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
+              <Select value={segment} onValueChange={(value: SegmentFilter) => setSegment(value)}>
+                <SelectTrigger className="w-full lg:w-[180px]">
+                  <SelectValue placeholder="세그먼트" />
+                </SelectTrigger>
+                <SelectContent>
+                  {SEGMENT_OPTIONS.map((option) => (
+                    <SelectItem key={option.value} value={option.value}>
+                      {option.label}
+                    </SelectItem>
+                  ))}
+                </SelectContent>
+              </Select>
+            </div>
+
+            <div className="max-h-[440px] overflow-y-auto rounded-md border">
+              <table className="w-full text-sm">
+                <thead className="sticky top-0 bg-muted text-left">
+                  <tr>
+                    <th className="px-4 py-2 font-medium">방 정보</th>
+                    <th className="px-4 py-2 font-medium">미확인</th>
+                    <th className="px-4 py-2 font-medium">지역/거리</th>
+                    <th className="px-4 py-2 font-medium">상태</th>
+                    <th className="px-4 py-2 font-medium">폴백</th>
+                  </tr>
+                </thead>
+                <tbody>
+                  {filteredRooms.map((room) => {
+                    const isActive = selectedRoom?.id === room.id
+                    return (
+                      <tr
+                        key={room.id}
+                        className={`cursor-pointer border-t transition hover:bg-accent/40 ${
+                          isActive ? 'bg-accent/60' : ''
+                        }`}
+                        onClick={() => setSelectedRoomId(room.id)}
+                      >
+                        <td className="px-4 py-3 align-top">
+                          <div className="flex flex-col">
+                            <span className="font-semibold">{room.title}</span>
+                            <span className="text-xs text-muted-foreground">
+                              {room.category} · 참여 {room.participants}명 · 생성 {room.createdAt}
+                            </span>
+                            <span className="text-xs text-muted-foreground">마지막 메시지 {room.lastMessageAt}</span>
+                          </div>
+                        </td>
+                        <td className="px-4 py-3 align-top">
+                          <div className="space-y-1 text-xs">
+                            <span>읽지 않음 {room.unread}건</span>
+                            <span>신규 메시지 {room.newMessages}건</span>
+                          </div>
+                        </td>
+                        <td className="px-4 py-3 align-top text-xs">
+                          <div>{room.region}</div>
+                          <div className="text-muted-foreground">약 {room.distanceKm}km</div>
+                        </td>
+                        <td className="px-4 py-3 align-top text-xs">
+                          <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
+                            {STATUS_LABEL[room.status]}
+                          </span>
+                        </td>
+                        <td className="px-4 py-3 align-top text-xs">
+                          {room.isFallback ? (
+                            <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">폴백</span>
+                          ) : (
+                            <span className="text-muted-foreground">API 성공</span>
+                          )}
+                        </td>
+                      </tr>
+                    )
+                  })}
+                  {filteredRooms.length === 0 && (
+                    <tr>
+                      <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
+                        조건에 맞는 대화방이 없습니다.
+                      </td>
+                    </tr>
+                  )}
+                </tbody>
+              </table>
+            </div>
+          </CardContent>
+        </Card>
+
+        <Card>
+          <CardHeader>
+            <CardTitle>신고/차단 현황</CardTitle>
+            <p className="text-sm text-muted-foreground">
+              커뮤니티 신고 API와 연동하여 신고/차단 요청을 분류하고, 상담사가 바로 처리할 수 있도록 지원합니다.
+            </p>
+          </CardHeader>
+          <CardContent className="space-y-3">
+            {REPORTS.map((report) => (
+              <div key={report.id} className="rounded-md border p-3 text-sm">
+                <div className="flex items-center justify-between">
+                  <span className="font-semibold">#{report.id}</span>
+                  <span className="text-xs text-muted-foreground">{report.createdAt}</span>
+                </div>
+                <p className="mt-1 text-muted-foreground">
+                  {report.reason} · 신고자 {report.reporter}
+                </p>
+                <div className="mt-2 flex flex-wrap gap-2">
+                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
+                    방 {report.roomId}
+                  </span>
+                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
+                    {report.status === 'PENDING' ? '미처리' : report.status === 'IN_PROGRESS' ? '처리 중' : '완료'}
+                  </span>
+                  <Button size="sm" variant="outline" onClick={() => escalateReport(report.id)}>
+                    신고 처리
+                  </Button>
+                </div>
+              </div>
+            ))}
+            {REPORTS.length === 0 && <p className="text-sm text-muted-foreground">신고 내역이 없습니다.</p>}
+          </CardContent>
+        </Card>
+      </section>
+
+      <section className="space-y-4">
+        <Card>
+          <CardHeader>
+            <CardTitle>채팅방 운영 도구</CardTitle>
+            <p className="text-sm text-muted-foreground">
+              상담사가 직접 채팅에 참여하거나, 방 제목/카테고리를 수정하고, 신고 모달을 통해 백엔드 API 호출을 준비합니다.
+            </p>
+          </CardHeader>
+          <CardContent className="space-y-4 text-sm">
+            {selectedRoom ? (
+              <>
+                <div className="grid gap-3 md:grid-cols-2">
+                  <div>
+                    <Label>방 제목</Label>
+                    <Input
+                      className="mt-1"
+                      value={selectedRoom.title}
+                      onChange={(event) =>
+                        setRooms((prev) =>
+                          prev.map((room) =>
+                            room.id === selectedRoom.id ? { ...room, title: event.target.value } : room
+                          )
+                        )
+                      }
+                    />
+                  </div>
+                  <div>
+                    <Label>카테고리</Label>
+                    <Input
+                      className="mt-1"
+                      value={selectedRoom.category}
+                      onChange={(event) =>
+                        setRooms((prev) =>
+                          prev.map((room) =>
+                            room.id === selectedRoom.id ? { ...room, category: event.target.value } : room
+                          )
+                        )
+                      }
+                    />
+                  </div>
+                  <div>
+                    <Label>지역</Label>
+                    <Input
+                      className="mt-1"
+                      value={selectedRoom.region}
+                      onChange={(event) =>
+                        setRooms((prev) =>
+                          prev.map((room) =>
+                            room.id === selectedRoom.id ? { ...room, region: event.target.value } : room
+                          )
+                        )
+                      }
+                    />
+                  </div>
+                  <div>
+                    <Label>거리 (km)</Label>
+                    <Input
+                      className="mt-1"
+                      type="number"
+                      value={selectedRoom.distanceKm}
+                      onChange={(event) =>
+                        setRooms((prev) =>
+                          prev.map((room) =>
+                            room.id === selectedRoom.id
+                              ? { ...room, distanceKm: Number(event.target.value) }
+                              : room
+                          )
+                        )
+                      }
+                    />
+                  </div>
+                </div>
+
+                <div className="space-y-3">
+                  <Label className="text-sm font-semibold">방 만들기 폴백</Label>
+                  <div className="flex items-center justify-between">
+                    <span>API 실패 시 로컬 폴백 방 생성 여부</span>
+                    <Switch checked={selectedRoom.isFallback} onCheckedChange={toggleFallback} />
+                  </div>
+                  <p className="text-xs text-muted-foreground">
+                    실패 시 로컬 폴백을 생성하면 상담사가 즉시 대응할 수 있습니다.
+                  </p>
+                </div>
+
+                <div className="space-y-3">
+                  <Label className="text-sm font-semibold">운영 메시지</Label>
+                  <Textarea
+                    value={cannedResponse}
+                    onChange={(event) => setCannedResponse(event.target.value)}
+                    placeholder="안내 메시지, 공지, 신고 안내 등을 입력하세요."
+                    rows={4}
+                  />
+                  <div className="flex flex-wrap gap-2">
+                    <Button size="sm" onClick={sendAnnouncement}>
+                      공지 발송
+                    </Button>
+                    <Button
+                      size="sm"
+                      variant="secondary"
+                      onClick={() => {
+                        setCannedResponse('신고 감사합니다. 운영팀이 검토 후 조치하겠습니다.')
+                      }}
+                    >
+                      신고 안내 문구 삽입
+                    </Button>
+                    <Button
+                      size="sm"
+                      variant="outline"
+                      onClick={() => setCannedResponse('')}
+                    >
+                      초기화
+                    </Button>
+                  </div>
+                </div>
+
+                <div className="space-y-3">
+                  <Label className="text-sm font-semibold">운영자 진입 제어</Label>
+                  <div className="flex items-center justify-between">
+                    <span>상담사 즉시 진입 허용</span>
+                    <Switch checked={allowEntry} onCheckedChange={setAllowEntry} />
+                  </div>
+                  <p className="text-xs text-muted-foreground">
+                    긴급 대응을 위해 상담사의 실시간 진입을 허용/제한합니다.
+                  </p>
+                  <div className="flex flex-wrap gap-2">
+                    <Button
+                      size="sm"
+                      onClick={() => toast({ title: '채팅방 진입', description: '상담사 계정으로 새 탭이 열립니다.' })}
+                    >
+                      상담사 진입
+                    </Button>
+                    <Button size="sm" variant="outline" onClick={() => updateStatus('NEEDS_REVIEW')}>
+                      검토 필요 처리
+                    </Button>
+                    <Button size="sm" variant="outline" onClick={() => updateStatus('ARCHIVED')}>
+                      방 종료 처리
+                    </Button>
+                  </div>
+                </div>
+              </>
+            ) : (
+              <p className="text-sm text-muted-foreground">좌측 목록에서 대화방을 선택하세요.</p>
+            )}
+          </CardContent>
+        </Card>
+      </section>
+    </div>
+  )
+}
