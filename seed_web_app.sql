-- Registers the reference WEB test app (TestWebApp/) in the AppRegistry catalog.
-- The C# seed (AppSeedData.cs) only runs on an empty table, so use this on an
-- existing database. Idempotent: skips if the 'reference-web' key already exists.
DECLARE @pid UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001'
IF NOT EXISTS (SELECT 1 FROM AbilityHub_AppRegistry.dbo.Applications WHERE [Key]='reference-web')
BEGIN
    INSERT INTO AbilityHub_AppRegistry.dbo.Applications (Id,[Key],Name,Description,Category,IconName,Color,Platform,Version,DataFormat,MinAge,MaxAge,IsActive,FeaturesJson,CreateUserId,CreatedAt) VALUES
    (NEWID(),'reference-web','Referentna Web Aplikacija','Referentna web aplikacija za testiranje integracije web aplikacija: centralizovana prijava, sinhronizacija preferencija, izvjestavanje o aktivnostima i zakljucavanje u realnom vremenu.','education','Globe','#0EA5E9','Web','1.0.0','abilityhub.usage.v1',4,18,1,'["Centralizovana prijava (SSO)","Sinhronizacija preferencija","Metrike pristupacnosti","Zakljucavanje u realnom vremenu"]',@pid,GETUTCDATE())
END
SELECT Id, [Key], Name, Platform FROM AbilityHub_AppRegistry.dbo.Applications WHERE [Key]='reference-web'
