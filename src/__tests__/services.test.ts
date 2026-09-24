import { createSeed } from '@/data/seed';
import { mockServices as api } from '@/services/mock';
import { __setDb } from '@/services/mock/db';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must be synchronous
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(() => __setDb(createSeed()));

describe('mock services', () => {
  it('signs in demo users with the shared password', async () => {
    await expect(api.auth.signIn('trainee', 'sense')).resolves.toMatchObject({ id: 'u-trainee' });
    await expect(api.auth.signIn('trainee', 'nope')).rejects.toThrow('invalid_credentials');
    // Mobile keyboards: capitalised first letter, trailing space, capitalised username.
    await expect(api.auth.signIn('Trainee ', 'Sense ')).resolves.toMatchObject({ id: 'u-trainee' });
  });

  it('keeps star ratings private', async () => {
    const [trainee, tech, instructor] = await Promise.all(['u-trainee', 'u-tech', 'u-instructor'].map((id) => api.auth.getUser(id)));
    expect(await api.social.listRatings(trainee!)).toHaveLength(0);
    expect((await api.social.listRatings(tech!)).every((r) => r.authorId === 'u-tech')).toBe(true);
    expect((await api.social.listRatings(instructor!)).length).toBeGreaterThan(2);
    await expect(api.social.ratePost(trainee!, 'po-1', 5)).rejects.toThrow('forbidden');
  });

  it('replaces a monthly rating instead of duplicating it', async () => {
    const instructor = (await api.auth.getUser('u-instructor'))!;
    await api.social.ratePost(instructor, 'po-6', 3);
    await api.social.ratePost(instructor, 'po-6', 5);
    const rs = (await api.social.listRatings(instructor)).filter((r) => r.postId === 'po-6');
    expect(rs).toHaveLength(1);
    expect(rs[0].stars).toBe(5);
  });

  it('toggles reactions', async () => {
    let p = await api.social.toggleReaction('po-9', 'u-trainee', 'idea');
    expect(p.reactions.idea).toContain('u-trainee');
    p = await api.social.toggleReaction('po-9', 'u-trainee', 'idea');
    expect(p.reactions.idea).not.toContain('u-trainee');
  });

  it('completes a challenge automatically when the goal is reached', async () => {
    const media = { kind: 'text' as const, tint: '#fff' };
    await api.social.createPost({ authorId: 'u-trainee', title: 'a', body: 'b', media, tags: [] });
    await api.social.createPost({ authorId: 'u-trainee', title: 'c', body: 'd', media, tags: [] });
    const ch = (await api.social.listChallenges()).find((c) => c.id === 'ch-1')!;
    expect(ch.completedBy).toContain('u-trainee');
  });

  it('records step outcomes and resolves alerts into the history', async () => {
    const p = await api.university.setStepOutcome('u-trainee', 'c-hem', 'hem-mt-1', 'completed');
    expect(p.completedStepIds).toContain('hem-mt-1');
    const before = (await api.training.listHistory('freesun-hemk')).length;
    await api.training.resolveAlert('al-1', 'u-tech');
    expect((await api.training.listHistory('freesun-hemk')).length).toBe(before + 1);
  });

  it('returns copies that cannot mutate the database', async () => {
    const post = (await api.social.getPost('po-1'))!;
    post.shares = 999;
    expect((await api.social.getPost('po-1'))!.shares).not.toBe(999);
  });
});
