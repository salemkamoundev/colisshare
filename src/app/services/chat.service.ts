import { Injectable } from '@angular/core';
import {
  Database,
  ref,
  push,
  query,
  orderByChild,
  onValue,
  serverTimestamp,
} from '@angular/fire/database';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private database: Database) {}

  // Récupérer les messages en temps réel
  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return new Observable((observer) => {
      const messagesRef = ref(
        this.database,
        `conversations/${conversationId}/messages`
      );
      const q = query(messagesRef, orderByChild('createdAt'));

      const unsubscribe = onValue(
        q,
        (snapshot) => {
          const messages: ChatMessage[] = [];
          snapshot.forEach((childSnapshot) => {
            messages.push({
              id: childSnapshot.key || undefined,
              ...childSnapshot.val(),
            });
          });
          observer.next(messages);
        },
        (error) => {
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  // Envoyer un message
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string
  ): Promise<void> {
    const messagesRef = ref(
      this.database,
      `conversations/${conversationId}/messages`
    );

    const message = {
      senderId,
      text,
      createdAt: serverTimestamp(),
    };

    await push(messagesRef, message);
  }
}
