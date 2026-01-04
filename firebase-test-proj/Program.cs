using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using System.Text.Json;

namespace FirebaseTestApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("===========================================");
            Console.WriteLine("Firebase Push Notification Test Console");
            Console.WriteLine("===========================================\n");

            try
            {
                // Step 1: Get Firebase Service Account JSON path
                Console.WriteLine("Step 1: Firebase Service Account Configuration");
                Console.WriteLine("----------------------------------------------");
                
                // Try to find serviceAccountKey.json in the current directory first
                string defaultServiceAccountPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "serviceAccountKey.json");
                string projectServiceAccountPath = "serviceAccountKey.json";
                string? serviceAccountPath = null;

                if (File.Exists(projectServiceAccountPath))
                {
                    serviceAccountPath = projectServiceAccountPath;
                    Console.WriteLine($"✓ Found serviceAccountKey.json in project directory");
                    Console.WriteLine($"  Using: {Path.GetFullPath(projectServiceAccountPath)}");
                }
                else if (File.Exists(defaultServiceAccountPath))
                {
                    serviceAccountPath = defaultServiceAccountPath;
                    Console.WriteLine($"✓ Found serviceAccountKey.json in application directory");
                }
                else
                {
                    Console.WriteLine("⚠ serviceAccountKey.json not found in project directory");
                    Console.Write("\nEnter the path to your Firebase service account JSON file: ");
                    serviceAccountPath = Console.ReadLine();

                    if (string.IsNullOrWhiteSpace(serviceAccountPath))
                    {
                        Console.WriteLine("Error: Service account path cannot be empty.");
                        return;
                    }

                    if (!File.Exists(serviceAccountPath))
                    {
                        Console.WriteLine($"Error: File not found at path: {serviceAccountPath}");
                        return;
                    }
                }

                // Initialize Firebase Admin SDK
                Console.WriteLine("\nInitializing Firebase Admin SDK...");
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile(serviceAccountPath)
                });
                Console.WriteLine("✓ Firebase Admin SDK initialized successfully!\n");

                // Step 2: Get notification details
                Console.WriteLine("Step 2: Notification Details");
                Console.WriteLine("----------------------------------------------");
                Console.Write("Enter notification title: ");
                string? title = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(title))
                {
                    title = "Test Notification";
                }

                Console.Write("Enter notification content/body: ");
                string? body = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(body))
                {
                    body = "This is a test notification from .NET console app";
                }

                // Step 3: Get device token
                Console.WriteLine("\nStep 3: Target Device");
                Console.WriteLine("----------------------------------------------");
                Console.Write("Enter the device FCM token: ");
                string? token = Console.ReadLine();

                if (string.IsNullOrWhiteSpace(token))
                {
                    Console.WriteLine("Error: Device token cannot be empty.");
                    return;
                }

                // Optional: Add custom data
                Console.WriteLine("\nStep 4: Additional Options (Optional)");
                Console.WriteLine("----------------------------------------------");
                Console.Write("Enter image URL (press Enter to skip): ");
                string? imageUrl = Console.ReadLine();

                Console.Write("Enter click action URL (press Enter to skip): ");
                string? clickActionUrl = Console.ReadLine();

                // Build custom data dictionary
                var customData = new Dictionary<string, string>
                {
                    { "sentFrom", ".NET Console App" },
                    { "timestamp", DateTime.UtcNow.ToString("o") }
                };

                if (!string.IsNullOrWhiteSpace(clickActionUrl))
                {
                    customData["url"] = clickActionUrl;
                }

                // Build the notification message
                var messageBuilder = new Message()
                {
                    Token = token,
                    Notification = new Notification()
                    {
                        Title = title,
                        Body = body,
                    },
                    Data = customData
                };

                // Add image if provided
                if (!string.IsNullOrWhiteSpace(imageUrl))
                {
                    messageBuilder.Notification.ImageUrl = imageUrl;
                }

                // Add web-specific configuration (only if click action URL is provided)
                if (!string.IsNullOrWhiteSpace(clickActionUrl))
                {
                    messageBuilder.Webpush = new WebpushConfig()
                    {
                        FcmOptions = new WebpushFcmOptions()
                        {
                            Link = clickActionUrl
                        }
                    };
                }

                // Display summary
                Console.WriteLine("\n===========================================");
                Console.WriteLine("Notification Summary");
                Console.WriteLine("===========================================");
                Console.WriteLine($"Title: {title}");
                Console.WriteLine($"Body: {body}");
                Console.WriteLine($"Token: {token.Substring(0, Math.Min(20, token.Length))}...");
                if (!string.IsNullOrWhiteSpace(imageUrl))
                    Console.WriteLine($"Image: {imageUrl}");
                if (!string.IsNullOrWhiteSpace(clickActionUrl))
                    Console.WriteLine($"Click Action: {clickActionUrl}");
                Console.WriteLine("===========================================\n");

                Console.Write("Send this notification? (Y/N): ");
                string? confirm = Console.ReadLine();

                if (confirm?.ToUpper() != "Y")
                {
                    Console.WriteLine("Notification sending cancelled.");
                    return;
                }

                // Step 5: Send the notification
                Console.WriteLine("\nSending notification...");
                string response = await FirebaseMessaging.DefaultInstance.SendAsync(messageBuilder);
                
                Console.WriteLine("\n✓ SUCCESS! Notification sent successfully!");
                Console.WriteLine($"Message ID: {response}");
                Console.WriteLine($"Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
                
            }
            catch (FirebaseMessagingException ex)
            {
                Console.WriteLine("\n✗ Firebase Messaging Error:");
                Console.WriteLine($"Error Code: {ex.MessagingErrorCode}");
                Console.WriteLine($"Message: {ex.Message}");
                
                if (ex.MessagingErrorCode == MessagingErrorCode.InvalidArgument)
                {
                    Console.WriteLine("\nPossible causes:");
                    Console.WriteLine("- Invalid FCM token format");
                    Console.WriteLine("- Token has expired or is invalid");
                }
                else if (ex.MessagingErrorCode == MessagingErrorCode.Unregistered)
                {
                    Console.WriteLine("\nThe device token is no longer valid. The device may have:");
                    Console.WriteLine("- Uninstalled the app");
                    Console.WriteLine("- Cleared browser data");
                    Console.WriteLine("- Token has expired");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("\n✗ Unexpected Error:");
                Console.WriteLine($"Type: {ex.GetType().Name}");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"\nStack Trace:\n{ex.StackTrace}");
            }

            Console.WriteLine("\n\nPress any key to exit...");
            Console.ReadKey();
        }
    }
}

