import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, Check, CreditCard, Pencil, Send, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useMockData } from '@/contexts/MockDataContext';
import {
  canApproveRequest,
  canCancelRequest,
  canEditRequest,
  canPayRequest,
  canRejectRequest,
  canSubmitRequest,
} from '@/lib/permissions';
import type { ReimbursementRequest, User } from '@/types/domain';

const rejectionSchema = z.object({
  reason: z.string().min(1, 'Informe a justificativa da rejeição.'),
});

type RejectionFormValues = z.infer<typeof rejectionSchema>;

export function RequestActions({
  request,
  user,
  onFeedback,
}: {
  request: ReimbursementRequest;
  user: User;
  onFeedback?: (message: string) => void;
}) {
  const { approveRequest, cancelRequest, payRequest, rejectRequest, submitRequest } = useMockData();
  const [rejectOpen, setRejectOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { reason: '' },
  });

  const notify = (message: string) => {
    onFeedback?.(message);
  };

  const submitRejection = handleSubmit((values) => {
    rejectRequest(request.id, user, values.reason);
    notify(`${request.id} rejeitada com justificativa.`);
    reset();
    setRejectOpen(false);
  });

  return (
    <div className="flex flex-wrap gap-2" aria-label={`Ações para ${request.id}`}>
      {canEditRequest(user, request) ? (
        <Button asChild variant="outline" size="sm">
          <Link to={`/requests/${request.id}/edit`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
      ) : null}
      {canSubmitRequest(user, request) ? (
        <Button
          type="button"
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
          onClick={(event) => {
            event.preventDefault();
            submitRequest(request.id, user);
            notify(`${request.id} enviada para análise do gestor.`);
          }}
        >
          <Send className="size-4" />
          Enviar
        </Button>
      ) : null}
      {canCancelRequest(user, request) ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={(event) => {
            event.preventDefault();
            cancelRequest(request.id, user);
            notify(`${request.id} cancelada.`);
          }}
        >
          <Ban className="size-4" />
          Cancelar
        </Button>
      ) : null}
      {canApproveRequest(user, request) ? (
        <Button
          type="button"
          size="sm"
          className="bg-emerald-700 hover:bg-emerald-800"
          onClick={(event) => {
            event.preventDefault();
            approveRequest(request.id, user);
            notify(`${request.id} aprovada.`);
          }}
        >
          <Check className="size-4" />
          Aprovar
        </Button>
      ) : null}
      {canRejectRequest(user, request) ? (
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm">
              <X className="size-4" />
              Rejeitar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar solicitação</DialogTitle>
              <DialogDescription>Informe uma justificativa antes de rejeitar {request.id}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitRejection} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`reject-${request.id}`}>Justificativa</Label>
                <Textarea
                  id={`reject-${request.id}`}
                  placeholder="Explique por que esta solicitação não pode ser aprovada."
                  {...register('reason')}
                />
                {errors.reason ? <p className="text-xs text-red-600">{errors.reason.message}</p> : null}
              </div>
              <DialogFooter>
                <Button type="submit" variant="destructive">
                  Rejeitar solicitação
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
      {canPayRequest(user, request) ? (
        <Button
          type="button"
          size="sm"
          className="bg-sky-700 hover:bg-sky-800"
          onClick={(event) => {
            event.preventDefault();
            payRequest(request.id, user);
            notify(`${request.id} marcada como paga.`);
          }}
        >
          <CreditCard className="size-4" />
          Marcar como paga
        </Button>
      ) : null}
    </div>
  );
}
