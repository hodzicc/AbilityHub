DECLARE @child1 UNIQUEIDENTIFIER = 'E86008FD-949C-44E5-B358-E6CEBC58030A'
DECLARE @child2 UNIQUEIDENTIFIER = 'E59EABC6-5F37-4331-86EE-45DF186CA3A5'
DECLARE @parent UNIQUEIDENTIFIER = '759E9742-1A78-4B6C-A3EE-42D43727A28D'

IF NOT EXISTS (SELECT 1 FROM AbilityHub_AppRegistry.dbo.ChildApplications WHERE ChildId = @child1)
    INSERT INTO AbilityHub_AppRegistry.dbo.ChildApplications (ChildId, ApplicationId, AssignedByGuardianId, AssignedAt)
    SELECT @child1, Id, @parent, GETUTCDATE() FROM AbilityHub_AppRegistry.dbo.Applications
    WHERE [Key] IN ('ucimo-slova','brojalica','moja-rutina','slagalica')

IF NOT EXISTS (SELECT 1 FROM AbilityHub_AppRegistry.dbo.ChildApplications WHERE ChildId = @child2)
    INSERT INTO AbilityHub_AppRegistry.dbo.ChildApplications (ChildId, ApplicationId, AssignedByGuardianId, AssignedAt)
    SELECT @child2, Id, @parent, GETUTCDATE() FROM AbilityHub_AppRegistry.dbo.Applications
    WHERE [Key] IN ('govor-i-glas','moja-rutina','ucimo-slova','motorika')

SELECT ca.ChildId, a.Name FROM AbilityHub_AppRegistry.dbo.ChildApplications ca
JOIN AbilityHub_AppRegistry.dbo.Applications a ON a.Id = ca.ApplicationId
ORDER BY ca.ChildId
