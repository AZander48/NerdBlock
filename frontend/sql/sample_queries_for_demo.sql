--Simple Queries:
--1. Retrieve all countries NerdBlock ships to:
SELECT DISTINCT CountryName FROM Country;

--2. List all available subscription genres:
SELECT Name FROM Genres;

--3. Display all supplier contact details:
SELECT Name, StreetAddress, PhoneNumber, Email FROM Suppliers;

--4. Show current employees at each store:
SELECT e.FirstName, e.LastName, s.City
FROM Employees e
JOIN Stores s ON e.StoreID = s.StoreID;

--5. List all products along with their prices:
SELECT Name, Description, Price FROM Products;

--Intermediate Queries:
--6. Find subscribers from Canada who subscribed to 'Fantasy':
SELECT s.FirstName, s.LastName, c.CountryName, g.Name AS Genre
FROM Subscriber s
JOIN Country c ON s.CountryID = c.CountryID
JOIN Genres g ON s.GenreID = g.GenreID
WHERE c.CountryName = 'Canada' AND g.Name = 'Fantasy';

--7. Show the inventory quantity for each product:
SELECT ProductName, Quantity FROM Inventory;

--8. Retrieve recent 5 transactions with subscriber names:
SELECT TOP 5 t.TransactionID, s.FirstName, s.LastName, t.TotalPrice, t.Date
FROM Transactions t
JOIN Subscriber s ON t.SubscriberID = s.SubscriberID
ORDER BY t.Date DESC;

--9. Get all employees who joined in the last year:
SELECT FirstName, LastName, DateJoined
FROM Employees
WHERE DateJoined > DATEADD(year, -1, GETDATE());

--10. List total overstock quantities for each product
SELECT p.Name, SUM(o.Quantity) AS OverstockQuantity
FROM Overstock o
JOIN Products p ON o.ProductID = p.ProductID
GROUP BY p.Name;

--Advanced Queries:
--11. Identify the most popular subscription type:
SELECT TOP 1 Type, COUNT(*) AS SubscriptionsCount
FROM Subscriptions sub
JOIN Subscriber s ON sub.SubscriptionID = s.SubscriptionID
GROUP BY Type
ORDER BY SubscriptionsCount DESC;

--12. Calculate total monthly revenue from subscriptions:
SELECT SUM(s.Price) AS MonthlyRevenue
FROM Subscriber sb
JOIN Subscriptions s ON sb.SubscriptionID = s.SubscriptionID
WHERE s.Type = 'Monthly';

--13. Report average shipping duration for the last month:
SELECT AVG(ShippingDuration) AS AvgShippingDays
FROM ShippingReport
WHERE Date >= DATEADD(month, -1, GETDATE());

--14. Determine products that frequently become overstock:
SELECT p.Name, COUNT(o.OverstockID) AS OverstockInstances
FROM Overstock o
JOIN Products p ON o.ProductID = p.ProductID
GROUP BY p.Name
HAVING COUNT(o.OverstockID) > 1;

--15. Find subscribers who have multiple subscriptions:
SELECT s.FirstName, s.LastName, COUNT(sb.SubscriptionID) AS TotalSubscriptions
FROM Subscriber s
JOIN Subscriptions sb ON s.SubscriptionID = sb.SubscriptionID
GROUP BY s.FirstName, s.LastName
HAVING COUNT(sb.SubscriptionID) > 1;

--Complex Analytical Queries:
--16. Show total revenue generated per genre in the last year:
SELECT g.Name AS Genre, SUM(t.TotalPrice) AS TotalRevenue
FROM Transactions t
JOIN Subscriber s ON t.SubscriberID = s.SubscriberID
JOIN Genres g ON s.GenreID = g.GenreID
WHERE t.Date >= DATEADD(year, -1, GETDATE())
GROUP BY g.Name;

--17. Report on employee sales performance (orders handled):
SELECT e.EmployeeID, e.FirstName, e.LastName, COUNT(o.OrderID) AS OrdersHandled
FROM Employees e
LEFT JOIN [Order] o ON e.EmployeeID = o.EmployeeID
GROUP BY e.EmployeeID, e.FirstName, e.LastName
ORDER BY OrdersHandled DESC;

--18. Analyze subscription growth by month:
SELECT YEAR(DateCreated) AS Year, MONTH(DateCreated) AS Month, COUNT(*) AS NewSubscribers
FROM Subscriber
GROUP BY YEAR(DateCreated), MONTH(DateCreated)
ORDER BY Year DESC, Month DESC;

--19. List countries with highest additional fees affecting subscription pricing:
SELECT CountryName, AdditionalFees
FROM Country
ORDER BY AdditionalFees DESC;

--20. Identify customers due for renewal (assuming yearly subscriptions):
SELECT s.FirstName, s.LastName, s.EmailAddress, sb.Type, s.DateCreated
FROM Subscriber s
JOIN Subscriptions sb ON s.SubscriptionID = sb.SubscriptionID
WHERE sb.Type = 'Annual' AND DATEADD(year, 1, s.DateCreated) BETWEEN GETDATE() AND DATEADD(month, 1, GETDATE());

--16