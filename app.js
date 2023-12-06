const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/auth-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const User = mongoose.model('User', {
  nome: String,
  email: { type: String, unique: true },
  senha: String,
  telefones: [{ numero: String, ddd: String }],
  data_criacao: { type: Date, default: Date.now },
  data_atualizacao: { type: Date, default: Date.now },
  ultimo_login: { type: Date, default: Date.now },
  token: String,
});

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ mensagem: 'Não autorizado' });
  }

  jwt.verify(token, 'segredo', (err, user) => {
    if (err) {
      return res.status(403).json({ mensagem: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registrar.html'));
  res.send('Teste Concluido!');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/procurar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'procurar.html'));
});

app.get('/registrar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registrar.html'));
});

app.post('/signup', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({ mensagem: 'E-mail já existente' });
    }

    const hashedPassword = await bcrypt.hash(req.body.senha, 10);

    const newUser = new User({
      nome: req.body.nome,
      email: req.body.email,
      senha: hashedPassword,
      telefones: req.body.telefones,
    });

    await newUser.save();

    const token = generateToken(newUser.email, newUser._id);

    newUser.token = token;
    await newUser.save();

    return res.status(201).json({
      id: newUser._id,
      data_criacao: newUser.data_criacao,
      data_atualizacao: newUser.data_atualizacao,
      ultimo_login: newUser.ultimo_login,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
});

app.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user || !(await bcrypt.compare(req.body.senha, user.senha))) {
      return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos' });
    }

    const token = generateToken(user.email, user._id);

    user.ultimo_login = Date.now();
    user.token = token;
    await user.save();

    return res.json({
      id: user._id,
      data_criacao: user.data_criacao,
      data_atualizacao: user.data_atualizacao,
      ultimo_login: user.ultimo_login,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
});

app.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }

    return res.json({
      id: user._id,
      data_criacao: user.data_criacao,
      data_atualizacao: user.data_atualizacao,
      ultimo_login: user.ultimo_login,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
});

function generateToken(email, userId) {
  return jwt.sign({ email, userId }, 'segredo', { expiresIn: '30m' });
}

module.exports = app;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
