const renderSuccessPage = ({ title, message, buttonText, url }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>

    <style>
      *{
        margin:0;
        padding:0;
        box-sizing:border-box;
        font-family:Arial,sans-serif;
      }

      body{
        background:#f8fafc;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
      }

      .card{
        background:#fff;
        padding:40px;
        width:420px;
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
        text-align:center;
      }

      .icon{
        width:70px;
        height:70px;
        border-radius:50%;
        background:#e8fff1;
        color:#16a34a;
        font-size:34px;
        display:flex;
        align-items:center;
        justify-content:center;
        margin:0 auto 20px;
      }

      h1{
        font-size:26px;
        color:#111827;
        margin-bottom:10px;
      }

      p{
        color:#6b7280;
        font-size:15px;
        line-height:1.6;
        margin-bottom:25px;
      }

      .btn{
        display:inline-block;
        background:#2563eb;
        color:#fff;
        text-decoration:none;
        padding:12px 24px;
        border-radius:10px;
        font-weight:600;
      }

      .btn:hover{
        background:#1d4ed8;
      }
    </style>
  </head>

  <body>
    <div class="card">
      <div class="icon">✓</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="${url}" class="btn">${buttonText}</a>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  renderSuccessPage
};