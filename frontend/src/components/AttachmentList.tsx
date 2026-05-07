import { FilePlus2, FileText, Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Attachment } from '@/types/domain';

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const [selectedFile, setSelectedFile] = useState('');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.fileUrl}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-orange-200 hover:bg-orange-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-orange-950/30"
            >
              <div className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">{attachment.fileName}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{attachment.fileType}</div>
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Nenhum anexo adicionado.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="mock-attachment" className="flex items-center gap-2 text-sm font-medium">
              <FilePlus2 className="size-4 text-orange-700" />
              Adicionar anexo
            </Label>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tipos aceitos: PDF, JPG e PNG.</p>
            <Input
              id="mock-attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-3 bg-white"
              onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? '')}
            />
          </div>
          <Button type="button" variant="outline" className="gap-2 bg-white" disabled={!selectedFile}>
            <Upload className="size-4" />
            Apenas visual
          </Button>
        </div>
        {selectedFile ? <p className="mt-2 text-xs text-orange-800 dark:text-orange-300">Selecionado: {selectedFile}</p> : null}
      </div>
    </div>
  );
}
