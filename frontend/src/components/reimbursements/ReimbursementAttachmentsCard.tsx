import { FileText, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUploadReimbursementAttachment } from '@/hooks/useAttachments';
import { getApiErrorMessage } from '@/lib/apiError';
import { attachmentSchema } from '@/schemas/attachmentSchema';
import type { Attachment, ReimbursementRequest } from '@/types/api';
import type { User } from '@/types/domain';

export function ReimbursementAttachmentsCard({
  attachments,
  onFeedback,
  reimbursement,
  user,
}: {
  attachments: Attachment[];
  onFeedback?: (message: string) => void;
  reimbursement: ReimbursementRequest;
  user?: User | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadAttachment = useUploadReimbursementAttachment();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canUpload = canUploadAttachment(user, reimbursement);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    const parsed = attachmentSchema.safeParse({ file });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Arquivo inválido.');
      return;
    }

    try {
      setErrorMessage(null);
      await uploadAttachment.mutateAsync({
        reimbursementId: reimbursement.id,
        payload: parsed.data,
      });
      onFeedback?.('Anexo enviado com sucesso.');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  return (
    <Card className='bg-white dark:bg-zinc-900'>
      <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <CardTitle>Anexos</CardTitle>
        {canUpload ? (
          <div>
            <Input
              ref={inputRef}
              aria-label='Arquivo do anexo'
              type='file'
              accept='application/pdf,.pdf'
              className='sr-only'
              onChange={(event) => void handleFileChange(event)}
            />
            <Button
              type='button'
              size='sm'
              className='bg-orange-600 hover:bg-orange-700'
              disabled={uploadAttachment.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className='size-4' />
              {uploadAttachment.isPending ? 'Enviando...' : 'Enviar anexo'}
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>Não foi possível enviar o anexo</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

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
                target='_blank'
                rel='noreferrer'
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

function canUploadAttachment(user: User | null | undefined, reimbursement: ReimbursementRequest) {
  return (
    user?.role === 'COLLABORATOR' &&
    reimbursement.requesterId === user.id &&
    reimbursement.status === 'DRAFT'
  );
}
