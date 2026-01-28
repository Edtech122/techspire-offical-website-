fetch("https://techspire-backend.onrender.com/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test",
    email: "test@gmail.com",
    message: "Hello Techspire"
  })
})
.then(res => res.json())
.then(data => console.log(data));
