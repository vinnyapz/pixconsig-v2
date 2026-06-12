export interface Notification {
    id: string;
    userId: string;
    type: 'SYSTEM' | 'MESSAGE' | 'STATUS_CHANGE';
    title: string;
    content: string;
    link: string;
    read: boolean;
    createdAt: string;
}
