declare module '@nestjs/config' {
  export class ConfigModule {
    static forRoot(options?: {
      isGlobal?: boolean;
      envFilePath?: string | string[];
      expandVariables?: boolean;
    }): import('@nestjs/common').DynamicModule;
  }
}
