function register(req, res) {
  const { name, email, password } = req.body;
  const user = {
    id: global.users.length + 1,
    name: name,
    email: email,
    password: password,
  };
  global.users.push(user);
  global.user_id = user;
  return res.status(201).json({ name: user.name, email: user.email });
}

function logon(req, res) {
  const { email, password } = req.body;
  const matchingUser = global.users.find((user) => user.email === email);
  if (matchingUser && matchingUser.password === password) {
    global.user_id = matchingUser;
    return res
      .status(200)
      .json({ name: matchingUser.name, email: matchingUser.email });
  } else {
    return res.status(401);
  }
}

function logoff(req, res) {
  global.user_id = null;
  return res.status(200);
}

module.exports = { register, logon, logoff };
