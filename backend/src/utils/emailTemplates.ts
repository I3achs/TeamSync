export const taskNotificationTemplate = (
  title: string,
  message: string,
  taskDetails: string,
  ctaLink: string
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #1e293b; font-size: 24px; }
        .content { font-size: 16px; line-height: 1.6; color: #475569; }
        .details-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .btn { display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; text-align: center; }
        .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>${title}</h2>
        </div>
        <div class="content">
            <p>${message}</p>
            <div class="details-box">
                ${taskDetails}
            </div>
            <div style="text-align: center;">
                <a href="${ctaLink}" class="btn">Xem chi tiết trên ứng dụng</a>
            </div>
        </div>
        <div class="footer">
            Đây là email thông báo tự động từ hệ thống quản lý dự án TeamSync.<br>
            Vui lòng không trả lời email này.
        </div>
    </div>
</body>
</html>
`;
