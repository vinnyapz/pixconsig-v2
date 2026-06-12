import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
}
