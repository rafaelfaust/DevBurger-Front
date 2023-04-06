import { yupResolver } from '@hookform/resolvers/yup'
import React from 'react'
import { useForm } from 'react-hook-form'
import * as Yup from 'yup'

import LoginImg from '../../assets/login-img.svg'
import Logo from '../../assets/logo.png'
import {
  Container,
  LoginImage,
  ContainerItens,
  Label,
  Input,
  ErrorMessage,
  Button,
  SignInLink,
  Dev
} from './styles'

const schema = Yup.object().shape({
  email: Yup.string()
    .email('Digite um e-mail válido')
    .required('O e-mail é obrigatorio'),
  password: Yup.string()
    .required('A senha é obrigatoria')
    .min(6, 'A senha deve ter pelo menos 6 digitos')
})

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = data => console.log(data)

  return (
    <Container>
      <LoginImage src={LoginImg} alt="login-image" />
      <ContainerItens>
        <img src={Logo} alt="logo-dev-burger" />
        <h1>Login</h1>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Label>Email</Label>
          <Input
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <ErrorMessage>{errors.email?.message}</ErrorMessage>

          <Label>Password</Label>
          <Input
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <ErrorMessage>{errors.password?.message}</ErrorMessage>

          <Button type="submit">Sign In</Button>
        </form>

        <SignInLink>
          {' '}
          Não possui conta? <a>Sign Up</a>{' '}
        </SignInLink>
      </ContainerItens>
      <Dev> 2023 Rafael Faust </Dev>
    </Container>
  )
}

export default Login
