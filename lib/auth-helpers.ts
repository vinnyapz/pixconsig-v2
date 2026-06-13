/** Verifica se o tipo de usuário tem permissões de admin (admin ou superadmin) */
export function isAdminType(type: string): boolean {
    return type === 'admin' || type === 'superadmin';
}

/** Verifica se o tipo de usuário é superadmin */
export function isSuperAdminType(type: string): boolean {
    return type === 'superadmin';
}
