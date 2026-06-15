DECLARE @pid UNIQUEIDENTIFIER = '759E9742-1A78-4B6C-A3EE-42D43727A28D'
IF NOT EXISTS (SELECT 1 FROM AbilityHub_AppRegistry.dbo.Applications WHERE [Key]='ucimo-slova')
BEGIN
    INSERT INTO AbilityHub_AppRegistry.dbo.Applications (Id,[Key],Name,Description,Category,IconName,Color,Platform,Version,DataFormat,MinAge,MaxAge,IsActive,FeaturesJson,CreateUserId,CreatedAt) VALUES
    (NEWID(),'ucimo-slova','Ucimo Slova','Interaktivna aplikacija za ucenje slova i citanja prilagodena djeci s Down sindromom.','education','BookOpen','#4F46E5','Mobile','2.1.0','abilityhub.usage.v1',4,12,1,'["Prepoznavanje slova","Slaganje rijeci","Zvucne nagrade","Prilagodljiva tezina"]',@pid,GETUTCDATE()),
    (NEWID(),'brojalica','Brojalica','Aplikacija za ucenje brojeva i matematickih operacija kroz igru i vizualne zadatke.','education','Calculator','#F59E0B','Mobile','1.4.2','abilityhub.usage.v1',5,14,1,'["Brojanje predmeta","Zbrajanje i oduzimanje","Vizualni prikaz","Nagrade"]',@pid,GETUTCDATE()),
    (NEWID(),'moja-rutina','Moja Rutina','Pomaze djeci da savladaju dnevne rutine kroz slike, raspored i podsjetnik za svaki korak.','daily','CalendarCheck','#F97316','Mobile','3.0.1','abilityhub.usage.v1',3,18,1,'["Dnevni raspored","Slikovne kartice","Podsjetnici","Pracenje zadataka"]',@pid,GETUTCDATE()),
    (NEWID(),'govor-i-glas','Govor i Glas','Vjezbe govora i artikulacije uz glasovne povratne informacije uz podrsku logopeda.','speech','Mic','#8B5CF6','Mobile','1.2.0','abilityhub.usage.v1',3,16,1,'["Vjezbe artikulacije","Snimanje glasa","Povratna informacija","Logopedski sadrzaj"]',@pid,GETUTCDATE()),
    (NEWID(),'slagalica','Slagalica','Puzzle igra s prilagodljivim brojem dijelova koja razvija prostornu inteligenciju.','games','Puzzle','#10B981','Mobile','2.3.1','abilityhub.usage.v1',4,16,1,'["4-48 dijelova","Tematske slike","Mjerenje vremena","Nagrade"]',@pid,GETUTCDATE()),
    (NEWID(),'motorika','Motorika','Vjezbe fine i grube motorike kroz interaktivne zadatke crtanja i preciznih pokreta prstima.','motor','Hand','#EF4444','Mobile','1.0.5','abilityhub.usage.v1',3,12,1,'["Vjezbe prstiju","Crtanje linija","Hvatanje objekata","Prilagodljiva osjetljivost"]',@pid,GETUTCDATE())
END
SELECT COUNT(*) AS AppsInDB FROM AbilityHub_AppRegistry.dbo.Applications
