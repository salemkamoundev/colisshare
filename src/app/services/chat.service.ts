import { Injectable, inject } from '@angular/core';
import { Database, ref, push, query, orderByChild, onValue, serverTimestamp, update, limitToLast } from '@angular/fire/database';
import { Observable, BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: number;
  readAt?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private database = inject(Database);
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private activeListeners: string[] = [];

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return new Observable((observer) => {
      const messagesRef = ref(this.database, `conversations/${conversationId}/messages`);
      const q = query(messagesRef, orderByChild('createdAt'));

      const unsubscribe = onValue(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
          const val = childSnapshot.val();
          messages.push({ id: childSnapshot.key || undefined, ...val });
        });
        observer.next(messages);
      }, (error) => observer.error(error));

      return () => unsubscribe();
    });
  }

  // Méthode pour obtenir le nombre de non-lus d'une conversation spécifique
  getUnreadCountForConversation(conversationId: string, currentUserId: string): Observable<number> {
    return new Observable((observer) => {
      const messagesRef = ref(this.database, `conversations/${conversationId}/messages`);
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        let count = 0;
        snapshot.forEach((child) => {
          const msg = child.val();
          if (msg.senderId !== currentUserId && !msg.readAt) {
            count++;
          }
        });
        observer.next(count);
      });
      return () => unsubscribe();
    });
  }

  async sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
    const messagesRef = ref(this.database, `conversations/${conversationId}/messages`);
    await push(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
      readAt: null
    });
  }

  async markAsRead(conversationId: string, currentUserId: string, messages: ChatMessage[]) {
    const updates: any = {};
    let hasUpdates = false;
    let decrementCount = 0;

    messages.forEach(msg => {
      if (msg.senderId !== currentUserId && !msg.readAt && msg.id) {
        updates[`conversations/${conversationId}/messages/${msg.id}/readAt`] = serverTimestamp();
        hasUpdates = true;
        decrementCount++;
      }
    });

    if (hasUpdates) {
      await update(ref(this.database), updates);
      // Mise à jour approximative du global (idéalement géré par le listener global)
      const current = this.unreadCountSubject.value;
      this.unreadCountSubject.next(Math.max(0, current - decrementCount));
    }
  }

  watchConversations(conversationIds: string[], currentUserId: string) {
    conversationIds.forEach(chatId => {
      if (this.activeListeners.includes(chatId)) return;
      this.activeListeners.push(chatId);
      
      const messagesRef = ref(this.database, `conversations/${chatId}/messages`);
      const q = query(messagesRef, limitToLast(1)); // On écoute juste le dernier pour la notif

      onValue(q, (snapshot) => {
        snapshot.forEach((child) => {
          const msg = child.val();
          if (msg.senderId !== currentUserId && !msg.readAt) {
             if (this.unreadCountSubject.value === 0) {
                this.unreadCountSubject.next(1);
             }
          }
        });
      });
    });
  }
}
