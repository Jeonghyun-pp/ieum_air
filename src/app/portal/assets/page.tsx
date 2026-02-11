'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { mockPortalData } from '@/lib/portal/mock';

export default function AssetsPage() {
  const { todos } = mockPortalData;

  return (
    <div className="space-y-6">
      {/* To-do 리스트 전체 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">To-do 리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start justify-between p-4 border border-border rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {todo.title}
                    </span>
                    {todo.required && (
                      <Badge variant="outline" className="text-xs">
                        필수
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    마감: {todo.due}
                  </p>
                </div>
                <Badge
                  variant={todo.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {todo.status === 'completed' ? '완료' : '대기'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Center */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">파일 업로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <Button variant="outline" size="sm">
              파일 선택
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              업로드된 파일
            </p>
            <div className="text-sm text-muted-foreground">
              아직 업로드된 파일이 없습니다.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages 섹션 */}
      <Card id="messages">
        <CardHeader>
          <CardTitle className="text-base">문의하기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              제목
            </label>
            <Input placeholder="문의 제목을 입력하세요" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              내용
            </label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="문의 내용을 입력하세요"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            전송하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
