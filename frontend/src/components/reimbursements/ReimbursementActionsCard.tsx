import { Ban, Check, CreditCard, Pencil, Send, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveReimbursement,
  useCancelReimbursement,
  usePayReimbursement,
  useRejectReimbursement,
  useSubmitReimbursement,
} from '@/hooks/useReimbursementActions';
import { getApiErrorMessage } from '@/lib/apiError';
import type { ReimbursementRequest } from '@/types/api';
import type { User } from '@/types/domain';

export function ReimbursementActionsCard({
  onFeedback,
  reimbursement,
  user,
}: {
  onFeedback: (message: string) => void;
  reimbursement: ReimbursementRequest;
  user: User;
}) {
  const submitMutation = useSubmitReimbursement();
  const cancelMutation = useCancelReimbursement();
  const approveMutation = useApproveReimbursement();
  const rejectMutation = useRejectReimbursement();
  const payMutation = usePayReimbursement();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const isPending =
    submitMutation.isPending ||
    cancelMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    payMutation.isPending;

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      setErrorMessage(null);
      await action();
      onFeedback(successMessage);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  const submitRejection = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      setRejectionError('Informe a justificativa da rejeição.');
      return;
    }

    await runAction(
      () =>
        rejectMutation.mutateAsync({
          id: reimbursement.id,
          payload: { rejectionReason: reason },
        }),
      `${reimbursement.id} rejeitada com justificativa.`,
    );
    setRejectionReason('');
    setRejectionError(null);
    setRejectOpen(false);
  };

  const hasActions =
    canEditReimbursement(user, reimbursement) ||
    canSubmitReimbursement(user, reimbursement) ||
    canCancelReimbursement(user, reimbursement) ||
    canApproveReimbursement(user, reimbursement) ||
    canRejectReimbursement(user, reimbursement) ||
    canPayReimbursement(user, reimbursement);

  return (
    <Card className='bg-zinc-950 text-white'>
      <CardHeader>
        <CardTitle className='text-white'>Ações disponíveis</CardTitle>
        <p className='text-sm text-zinc-300'>
          Ações exibidas conforme perfil e status da solicitação.
        </p>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <Alert variant='destructive' className='mb-4 bg-red-50 text-red-950'>
            <AlertTitle>Não foi possível concluir a ação</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className='flex flex-wrap gap-2' aria-label={`Ações para ${reimbursement.id}`}>
          {canEditReimbursement(user, reimbursement) ? (
            <Button asChild variant='outline' size='sm'>
              <Link to={`/requests/${reimbursement.id}/edit`}>
                <Pencil className='size-4' />
                Editar
              </Link>
            </Button>
          ) : null}

          {canSubmitReimbursement(user, reimbursement) ? (
            <Button
              type='button'
              size='sm'
              className='bg-orange-600 hover:bg-orange-700'
              disabled={isPending}
              onClick={() =>
                void runAction(
                  () => submitMutation.mutateAsync(reimbursement.id),
                  `${reimbursement.id} enviada para análise do gestor.`,
                )
              }
            >
              <Send className='size-4' />
              Enviar
            </Button>
          ) : null}

          {canCancelReimbursement(user, reimbursement) ? (
            <Button
              type='button'
              variant='destructive'
              size='sm'
              disabled={isPending}
              onClick={() =>
                void runAction(
                  () => cancelMutation.mutateAsync(reimbursement.id),
                  `${reimbursement.id} cancelada.`,
                )
              }
            >
              <Ban className='size-4' />
              Cancelar
            </Button>
          ) : null}

          {canApproveReimbursement(user, reimbursement) ? (
            <Button
              type='button'
              size='sm'
              className='bg-emerald-700 hover:bg-emerald-800'
              disabled={isPending}
              onClick={() =>
                void runAction(
                  () => approveMutation.mutateAsync(reimbursement.id),
                  `${reimbursement.id} aprovada.`,
                )
              }
            >
              <Check className='size-4' />
              Aprovar
            </Button>
          ) : null}

          {canRejectReimbursement(user, reimbursement) ? (
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button type='button' variant='destructive' size='sm' disabled={isPending}>
                  <X className='size-4' />
                  Rejeitar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rejeitar solicitação</DialogTitle>
                  <DialogDescription>
                    Informe uma justificativa antes de rejeitar {reimbursement.id}.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-2'>
                  <Label htmlFor={`reject-${reimbursement.id}`}>Justificativa</Label>
                  <Textarea
                    id={`reject-${reimbursement.id}`}
                    placeholder='Explique por que esta solicitação não pode ser aprovada.'
                    value={rejectionReason}
                    onChange={(event) => {
                      setRejectionReason(event.target.value);
                      setRejectionError(null);
                    }}
                  />
                  {rejectionError ? (
                    <p className='text-xs text-red-600'>{rejectionError}</p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='destructive'
                    disabled={isPending}
                    onClick={() => void submitRejection()}
                  >
                    Rejeitar solicitação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}

          {canPayReimbursement(user, reimbursement) ? (
            <Button
              type='button'
              size='sm'
              className='bg-sky-700 hover:bg-sky-800'
              disabled={isPending}
              onClick={() =>
                void runAction(
                  () => payMutation.mutateAsync(reimbursement.id),
                  `${reimbursement.id} marcada como paga.`,
                )
              }
            >
              <CreditCard className='size-4' />
              Marcar como paga
            </Button>
          ) : null}
        </div>

        <Separator className='my-5 bg-white/10' />
        <p className='text-sm text-zinc-300'>
          {hasActions
            ? 'Após concluir uma ação, a solicitação é atualizada automaticamente.'
            : 'Administradores e combinações sem permissão permanecem em modo consulta.'}
        </p>
      </CardContent>
    </Card>
  );
}

function canEditReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return (
    user.role === 'COLLABORATOR' &&
    reimbursement.requesterId === user.id &&
    reimbursement.status === 'DRAFT'
  );
}

function canSubmitReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return canEditReimbursement(user, reimbursement);
}

function canCancelReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return canEditReimbursement(user, reimbursement);
}

function canApproveReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return user.role === 'MANAGER' && reimbursement.status === 'SUBMITTED';
}

function canRejectReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return canApproveReimbursement(user, reimbursement);
}

function canPayReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return user.role === 'FINANCE' && reimbursement.status === 'APPROVED';
}
