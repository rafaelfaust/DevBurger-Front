import { yupResolver } from '@hookform/resolvers/yup'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as Yup from 'yup'

import Logo from '../../assets/logo.png'
import RegisterImg from '../../assets/user-img.svg'
import { Button, ErrorMessage } from '../../components'
import apiDevBurger from '../../services/api'
import {
  Container,
  RegisterImage,
  ContainerItens,
  Label,
  Input,
  SignUpLink,
  Dev
} from './styles'

const schema = Yup.object().shape({
  name: Yup.string('O Nome é obrigatório').required('O Nome é obrigatório'),
  email: Yup.string()
    .email('Digite um e-mail válido')
    .required('O e-mail é obrigatório'),
  password: Yup.string()
    .required('A senha é obrigatória')
    .min(6, 'A senha deve ter pelo menos 6 digitos'),
  confirmPassword: Yup.string()
    .required('A senha é obrigatória')
    .oneOf([Yup.ref('password')], 'As senhas devem ser iguais')
})

export function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async clientData => {
    try {
      const { status } = await apiDevBurger.post(
        'users',
        {
          name: clientData.name,
          email: clientData.email,
          password: clientData.password
        },
        { validateStatus: () => true }
      )

      if (status === 201 || status === 200) {
        toast.success('🦄 Cadastro realizado com sucesso!')
      } else if (status === 409) {
        toast.error('E-mail já cadastrado! Tente logar')
      } else {
        throw new Error()
      }
    } catch (err) {
      toast.error('Falha no sistema! Tente novamente.')
    }
  }

  return (
    <Container>
      <RegisterImage src={RegisterImg} alt="register-image" />
      <ContainerItens>
        <img src={Logo} alt="logo-dev-burger" />
        <h1>Cadastre-se</h1>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Label error={errors.name?.message}>Nome</Label>
          <Input
            type="text"
            {...register('name')}
            error={errors.name?.message}
          />
          <ErrorMessage>{errors.name?.message}</ErrorMessage>

          <Label error={errors.email?.message}>E-mail</Label>
          <Input
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <ErrorMessage>{errors.email?.message}</ErrorMessage>

          <Label error={errors.password?.message}>Senha</Label>
          <Input
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <ErrorMessage>{errors.password?.message}</ErrorMessage>

          <Label error={errors.confirmPassword?.message}>Confirmar Senha</Label>
          <Input
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <ErrorMessage>{errors.confirmPassword?.message}</ErrorMessage>

          <Button type="submit" style={{ marginTop: 25 }}>
            Sign Up
          </Button>
        </form>

        <SignUpLink>
          {' '}
          Já possui conta?
          <Link style={{ color: '#efa216' }} to="/login">
            Sign In
          </Link>{' '}
        </SignUpLink>
      </ContainerItens>
      <Dev> &copy; All Rights Reserved. Designed by Rafael Faust </Dev>
    </Container>
  )
}
