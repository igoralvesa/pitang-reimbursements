import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ReimbursementConsultationCard() {
  return (
    <Card className='bg-zinc-950 text-white'>
      <CardHeader>
        <CardTitle className='text-white'>Ações disponíveis</CardTitle>
        <p className='text-sm text-zinc-300'>
          Ações exibidas conforme perfil e status da solicitação.
        </p>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-zinc-300'>
          Esta solicitação está disponível para consulta com os dados atualizados.
        </p>
        <Separator className='my-5 bg-white/10' />
        <p className='text-sm text-zinc-300'>
          Administradores e combinações sem permissão permanecem em modo consulta.
        </p>
      </CardContent>
    </Card>
  );
}
