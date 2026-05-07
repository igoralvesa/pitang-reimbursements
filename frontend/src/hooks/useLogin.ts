import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: Parameters<typeof authService.login>[0]) => {
      const { token } = await authService.login(payload);
      const user = await authService.me(token);

      return { token, user };
    },
  });
}
