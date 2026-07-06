-- По шаблону коэффициент К применяется к упаковке в п/э пакет и бабл-плёнку
UPDATE [dbo].[OperationsCatalog] SET [applySizeCoef] = 1
WHERE [code] IN (N'poly_bag', N'bubble_wrap');
