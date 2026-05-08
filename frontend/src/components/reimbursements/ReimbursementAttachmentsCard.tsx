import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Attachment } from '@/types/api';

export function ReimbursementAttachmentsCard({
  attachments,
}: {
  attachments: Attachment[];
}) {
  return (
    <Card className='bg-white dark:bg-zinc-900'>
      <CardHeader>
        <CardTitle>Anexos</CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className='rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
            Nenhum anexo adicionado.
          </div>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2'>
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                className='flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-orange-200 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-orange-950/30'
              >
                <div className='rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
                  <FileText className='size-5' />
                </div>
                <div className='min-w-0'>
                  <div className='truncate text-sm font-medium text-zinc-950 dark:text-zinc-50'>
                    {attachment.fileName}
                  </div>
                  <div className='text-xs text-zinc-500 dark:text-zinc-400'>
                    {attachment.fileType}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
