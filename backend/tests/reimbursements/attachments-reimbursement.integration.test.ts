import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import request from 'supertest';
import { Writable } from 'node:stream';

import { ReimbursementStatus } from '../../generated/prisma/client';
import { cloudinary } from '../../src/config/cloudinary';
import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import {
  createDraftReimbursementFixture,
  createApprovedReimbursementFixture,
  createReimbursementFixture,
  createSubmittedReimbursementFixture,
  createUserFixture,
  getSeedUser,
} from '../helpers/factories';

describe('Reimbursement attachments endpoints', () => {
  let cloudinaryUploadOptions: {
    folder?: string;
    public_id?: string;
    resource_type?: string;
  }[] = [];

  beforeEach(async () => {
    await prepareDatabase();
    cloudinaryUploadOptions = [];

    jest.spyOn(cloudinary.uploader as any, 'upload_stream').mockImplementation(
      ((
        options: {
          folder?: string;
          public_id?: string;
          resource_type?: string;
        },
        callback?: (error?: unknown, result?: unknown) => void,
      ) => {
        cloudinaryUploadOptions.push(options);

        return new Writable({
          final(done) {
            const publicId = `${options.folder}/${options.public_id}`;

            callback?.(undefined, {
              bytes: 1024,
              format: 'pdf',
              public_id: publicId,
              resource_type: 'raw',
              secure_url:
                `https://res.cloudinary.com/mock-cloud/raw/upload/${publicId}`,
            } as never);
            done();
          },
          write(_chunk, _encoding, done) {
            done();
          },
        });
      }) as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /reimbursements/:id/attachments', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/attachments',
      );

      expect(response.status).toBe(401);
    });

    it.each([
      ['ADMIN', Role.ADMIN],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/attachments')
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(403);
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/attachments')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', Buffer.from('%PDF-1.4'), {
          contentType: 'application/pdf',
          filename: 'receipt.pdf',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'Solicitação de reembolso não encontrada',
      });
    });

    it('returns 403 when authenticated collaborator is not the owner', async () => {
      const otherUser = await createUserFixture({
        email: 'outro-colaborador@email.com',
      });
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: otherUser.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', Buffer.from('%PDF-1.4'), {
          contentType: 'application/pdf',
          filename: 'receipt.pdf',
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'Usuário sem permissão para acessar este recurso',
      });
    });

    it('returns 400 when reimbursement status is not DRAFT', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createSubmittedReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', Buffer.from('%PDF-1.4'), {
          contentType: 'application/pdf',
          filename: 'receipt.pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Status da solicitação não permite anexar arquivos',
      });
    });

    it('returns 400 when file type is invalid', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', Buffer.from('invalid file'), {
          contentType: 'text/plain',
          filename: 'receipt.txt',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Arquivo inválido',
      });
    });

    it('returns 400 when file is missing', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Arquivo é obrigatório',
      });
    });

    it('creates an attachment when upload succeeds', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createReimbursementFixture({
        requesterId: collaborator.id,
        status: ReimbursementStatus.DRAFT,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', Buffer.from('%PDF-1.4'), {
          contentType: 'application/pdf',
          filename: 'receipt.pdf',
        });

      expect(response.status).toBe(201);
      expect(cloudinaryUploadOptions).toHaveLength(1);
      const uploadOptions = cloudinaryUploadOptions[0]!;

      expect(uploadOptions).toMatchObject({
        folder: `reimbursements/${reimbursement.id}`,
        resource_type: 'raw',
      });
      expect(uploadOptions.public_id).toMatch(
        /^receipt-[0-9a-f-]+\.pdf$/,
      );
      expect(response.body).toEqual({
        cloudinaryPublicId: `reimbursements/${reimbursement.id}/${uploadOptions.public_id}`,
        createdAt: expect.any(String),
        fileName: 'receipt.pdf',
        fileType: 'application/pdf',
        fileUrl: `https://res.cloudinary.com/mock-cloud/raw/upload/reimbursements/${reimbursement.id}/${uploadOptions.public_id}`,
        id: expect.any(String),
        reimbursementId: reimbursement.id,
      });

      const attachment = await prisma.attachment.findUnique({
        where: { id: response.body.id },
      });

      expect(attachment).toMatchObject({
        fileName: 'receipt.pdf',
        fileType: 'application/pdf',
        fileUrl: `https://res.cloudinary.com/mock-cloud/raw/upload/reimbursements/${reimbursement.id}/${uploadOptions.public_id}`,
        publicId: `reimbursements/${reimbursement.id}/${uploadOptions.public_id}`,
        reimbursementRequestId: reimbursement.id,
      });
    });

    it.each([
      ['image/jpeg', 'receipt.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])],
      ['image/png', 'receipt.png', Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    ] as const)('returns 400 when file type is %s', async (
      contentType,
      fileName,
      fileSignature,
    ) => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createReimbursementFixture({
        requesterId: collaborator.id,
        status: ReimbursementStatus.DRAFT,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', fileSignature, {
          contentType,
          filename: fileName,
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Arquivo inválido',
      });
      expect(cloudinaryUploadOptions).toHaveLength(0);
    });

    it('returns 500 with Cloudinary upload message and does not save metadata when Cloudinary upload fails', async () => {
      jest
        .spyOn(cloudinary.uploader as any, 'upload_stream')
        .mockImplementationOnce(
          ((
            _options: { folder?: string },
            callback?: (error?: unknown, result?: unknown) => void,
          ) =>
            new Writable({
              final(done) {
                callback?.(
                  Object.assign(new Error('Cloudinary unavailable'), {
                    http_code: 500,
                  }),
                );
                done();
              },
              write(_chunk, _encoding, done) {
                done();
              },
            })) as never,
        );

      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createReimbursementFixture({
        requesterId: collaborator.id,
        status: ReimbursementStatus.DRAFT,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .attach('file', Buffer.from('%PDF-1.4'), {
          contentType: 'application/pdf',
          filename: 'receipt.pdf',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'Erro no upload para Cloudinary',
      });

      const attachments = await prisma.attachment.findMany({
        where: { reimbursementRequestId: reimbursement.id },
      });

      expect(attachments).toHaveLength(0);
    });
  });

  describe('GET /reimbursements/:id/attachments', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get(
        '/reimbursements/00000000-0000-0000-0000-000000000000/attachments',
      );

      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid reimbursement id', async () => {
      const response = await request(app)
        .get('/reimbursements/invalid-id/attachments')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(400);
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .get('/reimbursements/00000000-0000-0000-0000-000000000000/attachments')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'Solicitação de reembolso não encontrada',
      });
    });

    it('allows collaborator to list own reimbursement attachments', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      const attachment = await prisma.attachment.create({
        data: {
          fileName: 'receipt.pdf',
          fileType: 'application/pdf',
          fileUrl:
            'https://res.cloudinary.com/mock-cloud/image/upload/receipt.pdf',
          publicId: `reimbursements/${reimbursement.id}/receipt`,
          reimbursementRequestId: reimbursement.id,
          size: 1024,
        },
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          cloudinaryPublicId: attachment.publicId,
          createdAt: attachment.createdAt.toISOString(),
          fileName: 'receipt.pdf',
          fileType: 'application/pdf',
          fileUrl:
            'https://res.cloudinary.com/mock-cloud/image/upload/receipt.pdf',
          id: attachment.id,
          reimbursementId: reimbursement.id,
        },
      ]);
    });

    it('returns 403 when collaborator lists another requester attachments', async () => {
      const otherUser = await createUserFixture({
        email: 'dono-dos-anexos@email.com',
      });
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: otherUser.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'Usuário sem permissão para acessar este recurso',
      });
    });

    it('allows manager to list submitted reimbursement attachments', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns 403 when manager lists non-submitted reimbursement attachments', async () => {
      const reimbursement = await createApprovedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });

    it('allows finance to list approved reimbursement attachments', async () => {
      const reimbursement = await createApprovedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns 403 when finance lists non-approved reimbursement attachments', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(403);
    });

    it('allows admin to list any reimbursement attachments', async () => {
      const reimbursement = await createDraftReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/attachments`)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
