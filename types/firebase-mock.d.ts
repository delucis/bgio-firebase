declare module 'firebase-mock' {
  import * as admin from 'firebase-admin';
  import 'firebase/database';

  export type EventType =
    | 'value'
    | 'child_added'
    | 'child_changed'
    | 'child_moved'
    | 'child_removed';
  export type OnComplete = (a: Error | null) => any;

  export class MockFirebaseSdk implements MockFirebaseSdk {
    constructor(
      createDatabase?: (path: string) => MockFirebase | null,
      createAuth?: () => MockAuthentication | null,
      createFirestore?: () => MockFirestore | null,
      createStorage?: () => MockStorage | null,
      createMessaging?: () => MockMessaging | null
    );
  }

  export interface MockFirebaseSdk extends admin.app.App {
    app: (name?: string | undefined) => admin.app.App;
    SDK_VERSION: string;
    apps: admin.app.App[];
    credential: admin.credential.Credential & typeof admin['credential'];
    database: {
      (): MockFirebaseDatabase;
      enableLogging: () => void;
      ServerValue: any;
    };
    auth: () => MockAuthentication;
    firestore: {
      (): MockFirestore;
    } & typeof admin['firestore'];
    storage: () => MockStorage;
    messaging: () => MockMessaging;
    projectManagement: {
      (): admin.projectManagement.ProjectManagement;
    } & typeof admin['projectManagement'];
    initializeApp: () => {
      database: {
        ref: (path?: string) => MockFirebase;
        refFromURL: (path: string) => MockFirebase;
      };
      auth: MockAuthentication;
      firestore: MockFirestore;
      storage: MockStorage;
      messaging: MockMessaging;
    } & admin.app.App;
    delete: () => Promise<any>;
    name: string;
    options: Record<string, any>;
  }

  export class MockFirebase implements admin.database.Reference {
    /* Firebase database properties */
    readonly key: string | null;
    readonly parent: admin.database.Reference | null;
    readonly ref: admin.database.Reference;
    readonly root: admin.database.Reference;

    child(path: string): MockFirebase;
    endAt(
      value: number | string | boolean | null,
      key?: string
    ): admin.database.Query;
    equalTo(
      value: number | string | boolean | null,
      key?: string
    ): admin.database.Query;
    isEqual(other: admin.database.Query | null): boolean;
    limitToFirst(limit: number): admin.database.Query;
    limitToLast(limit: number): admin.database.Query;
    off(
      eventType?: EventType,
      callback?: (a: admin.database.DataSnapshot, b?: string | null) => any,
      context?: Record<string, any> | null
    ): void;
    on(
      eventType: EventType,
      callback: (a: admin.database.DataSnapshot | null, b?: string) => any,
      cancelCallbackOrContext?: Record<string, any> | null,
      context?: Record<string, any> | null
    ): (a: admin.database.DataSnapshot | null, b?: string) => any;
    onDisconnect(): admin.database.OnDisconnect;
    once(
      eventType: EventType,
      successCallback?: (a: admin.database.DataSnapshot, b?: string) => any,
      failureCallbackOrContext?:
        | ((e: Error) => any)
        | Record<string, any>
        | null,
      context?: Record<string, any> | null
    ): Promise<admin.database.DataSnapshot>;
    orderByChild(path: string): admin.database.Query;
    orderByKey(): admin.database.Query;
    orderByPriority(): admin.database.Query;
    orderByValue(): admin.database.Query;
    path: string;
    push(
      value?: any,
      onComplete?: OnComplete
    ): admin.database.ThenableReference;
    remove(onComplete?: OnComplete): Promise<any>;
    set(value: any, onComplete?: OnComplete): Promise<any>;
    setPriority(
      priority: string | number | null,
      onComplete: OnComplete
    ): Promise<any>;
    setWithPriority(
      newVal: any,
      newPriority: string | number | null,
      onComplete?: OnComplete
    ): Promise<any>;
    startAt(
      value: number | string | boolean | null,
      key?: string
    ): admin.database.Query;
    toJSON(): Record<string, any>;
    toString(): string;
    transaction(
      transactionUpdate: (a: any) => any,
      onComplete?: (
        a: Error | null,
        b: boolean,
        c: admin.database.DataSnapshot | null
      ) => any,
      applyLocally?: boolean
    ): Promise<any>;
    update(values: Record<string, any>, onComplete?: OnComplete): Promise<any>;

    /* Mock properties */
    flush(delay?: number): MockFirebase;
    autoFlush(delayOrSetting?: number | boolean): MockFirebase;
    failNext(method: string, err: Error): void;
    // TODO forceCancel(err: any, event?: string, callback: ???, context: ): void;
    getData(): any;
    getKeys(): string[];
    // TODO fakeEvent(event: string, key?: string, data?: any, previousChild?: ???, priority: ???): MockFirebase;
    getFlushQueue(): any[]; // TODO Event[];
  }

  export interface MockFirebaseDatabase extends admin.database.Database {
    ref: (path?: string) => MockFirebase;
    refFromURL: (path: string) => MockFirebase;

    /* Mock properties */
    flush(delay?: number): MockFirebase;
    autoFlush(delayOrSetting?: number | boolean): MockFirebase;
  }

  export class MockAuthentication implements admin.auth.Auth {
    /* Firebase API properties */
    app: admin.app.App;
    createCustomToken(
      uid: string,
      developerClaims?: Record<string, any>
    ): Promise<string>;
    createProviderConfig(
      config: admin.auth.AuthProviderConfig
    ): Promise<admin.auth.AuthProviderConfig>;
    createSessionCookie(
      idToken: string,
      sessionCookieOptions: admin.auth.SessionCookieOptions
    ): Promise<string>;
    createUser(
      properties: admin.auth.CreateRequest
    ): Promise<admin.auth.UserRecord>;
    deleteProviderConfig(providerId: string): Promise<void>;
    deleteUser(uid: string): Promise<void>;
    generateEmailVerificationLink(
      email: string,
      actionCodeSettings?: admin.auth.ActionCodeSettings
    ): Promise<string>;
    generatePasswordResetLink(
      email: string,
      actionCodeSettings?: admin.auth.ActionCodeSettings
    ): Promise<string>;
    generateSignInWithEmailLink(
      email: string,
      actionCodeSettings: admin.auth.ActionCodeSettings
    ): Promise<string>;
    getProviderConfig(
      providerId: string
    ): Promise<admin.auth.AuthProviderConfig>;
    getUser(uid: string): Promise<admin.auth.UserRecord>;
    getUserByEmail(email: string): Promise<admin.auth.UserRecord>;
    getUserByPhoneNumber(phoneNumber: string): Promise<admin.auth.UserRecord>;
    importUsers(
      users: admin.auth.UserImportRecord[],
      options?: admin.auth.UserImportOptions
    ): Promise<admin.auth.UserImportResult>;
    listProviderConfigs(
      options: admin.auth.AuthProviderConfigFilter
    ): Promise<admin.auth.ListProviderConfigResults>;
    listUsers(
      maxResults?: number,
      pageToken?: string
    ): Promise<admin.auth.ListUsersResult>;
    revokeRefreshTokens(uid: string): Promise<void>;
    setCustomUserClaims(
      uid: string,
      customUserClaims: Record<string, any> | null
    ): Promise<void>;
    tenantManager(): admin.auth.TenantManager;
    updateProviderConfig(
      providerId: string,
      updatedConfig: admin.auth.UpdateAuthProviderRequest
    ): Promise<admin.auth.AuthProviderConfig>;
    updateUser(
      uid: string,
      properties: admin.auth.UpdateRequest
    ): Promise<admin.auth.UserRecord>;
    verifyIdToken(
      idToken: string,
      checkRevoked?: boolean
    ): Promise<admin.auth.DecodedIdToken>;
    verifySessionCookie(
      sessionCookie: string,
      checkForRevocation?: boolean
    ): Promise<admin.auth.DecodedIdToken>;

    /* Mock properties */
    changeAuthState(authData: admin.auth.UserInfo | null): void;
    flush(delay?: number): MockAuthentication;
    autoFlush(delay?: number): MockAuthentication;
    failNext(methodName: string, err: Error): void;
  }

  export class MockFirestore implements admin.firestore.Firestore {
    app: admin.app.App;
    batch(): FirebaseFirestore.WriteBatch;
    collection(collectionPath: string): FirebaseFirestore.CollectionReference;
    collectionGroup(collectionId: string): FirebaseFirestore.Query;
    doc(documentPath: string): FirebaseFirestore.DocumentReference;
    getAll(
      documentRefsOrReadOptions:
        | FirebaseFirestore.DocumentReference
        | FirebaseFirestore.ReadOptions
    ): Promise<Array<FirebaseFirestore.DocumentSnapshot>>;
    listCollections(): Promise<Array<FirebaseFirestore.CollectionReference>>;
    runTransaction<T>(
      updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
    ): Promise<T>;
    settings(settings: FirebaseFirestore.Settings): void;
    terminate(): Promise<void>;

    // This is undocumented but our code won't compile without it
    INTERNAL: { delete: () => Promise<void> };
    /* Mock properties */
    flush(delay?: number): MockFirebase;
    autoFlush(delayOrSetting?: number | boolean): MockFirebase;
  }

  export class MockStorage implements admin.storage.Storage {
    app: admin.app.App;
    bucket(name?: string): ReturnType<admin.storage.Storage['bucket']>;
  }

  export class MockMessaging implements admin.messaging.Messaging {
    app: admin.app.App;
    send(message: admin.messaging.Message, dryRun?: boolean): Promise<string>;
    sendAll(
      messages: Array<admin.messaging.Message>,
      dryRun?: boolean
    ): Promise<admin.messaging.BatchResponse>;
    sendMulticast(
      message: admin.messaging.MulticastMessage,
      dryRun?: boolean
    ): Promise<admin.messaging.BatchResponse>;
    sendToCondition(
      condition: string,
      payload: admin.messaging.MessagingPayload,
      options?: admin.messaging.MessagingOptions
    ): Promise<admin.messaging.MessagingConditionResponse>;
    sendToDevice(
      registrationToken: string | string[],
      payload: admin.messaging.MessagingPayload,
      options?: admin.messaging.MessagingOptions
    ): Promise<admin.messaging.MessagingDevicesResponse>;
    sendToDeviceGroup(
      notificationKey: string,
      payload: admin.messaging.MessagingPayload,
      options?: admin.messaging.MessagingOptions
    ): Promise<admin.messaging.MessagingDeviceGroupResponse>;
    sendToTopic(
      topic: string,
      payload: admin.messaging.MessagingPayload,
      options?: admin.messaging.MessagingOptions
    ): Promise<admin.messaging.MessagingTopicResponse>;
    subscribeToTopic(
      registrationTokens: string | string[],
      topic: string
    ): Promise<admin.messaging.MessagingTopicManagementResponse>;
    unsubscribeFromTopic(
      registrationTokens: string | string[],
      topic: string
    ): Promise<admin.messaging.MessagingTopicManagementResponse>;
  }
}
