/**
 * v2 web bridge tests: device registration with `web` platform and the
 * POST /v2/auth/exchange flow (v1 user JWT -> device-bound v2 session).
 *
 * Requires DATABASE_URL (docker postgres). Uses a unique tenant per run.
 */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

import { createApp } from '../src/app';
import { prismaRaw } from '../src/infra/prisma';

const slug = `test-exchange-${Date.now()}`;
const email = 'exchange.supervisor@example.com';
const password = 'Exchange-Test-1!';
let deviceId = '';
let v1Token = '';

beforeAll(async () => {
    const tenant = await prismaRaw.tenant.create({
        data: { slug, name: 'Exchange Test Campus' }
    });
    await prismaRaw.userAccount.create({
        data: {
            tenantId: tenant.id,
            name: 'Exchange Supervisor',
            idNumber: 'SUP-EX-1',
            email,
            role: 'supervisor',
            passwordHash: await bcrypt.hash(password, 10),
            verified: true,
            status: 'active'
        }
    });
});

afterAll(async () => {
    const tenant = await prismaRaw.tenant.findUnique({ where: { slug } });
    if (tenant) {
        await prismaRaw.userRoleV2.deleteMany({ where: { tenantId: tenant.id } });
        await prismaRaw.deviceSession.deleteMany({ where: { tenantId: tenant.id } });
        await prismaRaw.deviceV2.deleteMany({ where: { tenantId: tenant.id } });
        await prismaRaw.userAccount.deleteMany({ where: { tenantId: tenant.id } });
        await prismaRaw.tenant.delete({ where: { id: tenant.id } });
    }
    await prismaRaw.$disconnect();
});

describe('v2 web device + exchange bridge', () => {
    it('registers a web-platform device', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/v2/devices/register')
            .set('X-Tenant-Slug', slug)
            .send({
                platform: 'web',
                device_name: 'vitest-browser',
                device_fingerprint: `web-vitest-${Date.now()}`
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.device.id).toEqual(expect.any(String));
        deviceId = res.body.data.device.id;
    });

    it('logs in via v1 and exchanges for a v2 session', async () => {
        const app = createApp();
        const login = await request(app)
            .post('/api/v1/users/login')
            .set('X-Tenant-Slug', slug)
            .send({ email, password });
        expect(login.status).toBe(200);
        v1Token = login.body.accessToken ?? login.body.data?.accessToken;
        expect(typeof v1Token).toBe('string');

        const exchange = await request(app)
            .post('/api/v2/auth/exchange')
            .set('X-Tenant-Slug', slug)
            .set('Authorization', `Bearer ${v1Token}`)
            .send({ device_id: deviceId });
        expect(exchange.status).toBe(200);
        expect(exchange.body.success).toBe(true);
        expect(exchange.body.data.session.access_token).toEqual(expect.any(String));
        expect(exchange.body.data.user.roles.supervisor).toBe(true);

        const dashboard = await request(app)
            .get('/api/v2/supervisor/dashboard')
            .set('X-Tenant-Slug', slug)
            .set('Authorization', `Bearer ${exchange.body.data.session.access_token}`);
        expect(dashboard.status).toBe(200);
        expect(dashboard.body.success).toBe(true);
        expect(dashboard.body.data.summary).toBeDefined();
    });

    it('rejects exchange without a v1 token', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/v2/auth/exchange')
            .set('X-Tenant-Slug', slug)
            .send({ device_id: deviceId });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
