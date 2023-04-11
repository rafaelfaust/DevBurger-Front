import styled from 'styled-components'

import Background from '../../assets/bg.jpg'

export const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background: url('${Background}');
  display: flex;
  justify-content: center;
  align-items: center;
`
export const RegisterImage = styled.img`
  height: 90%;
`
export const ContainerItens = styled.div`
  height: 90%;
  background: #373737;
  border-radius: 0 10px 10px 0;
  padding: 25px 75px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  h1 {
    text-align: center;
    font-style: normal;
    font-weight: 500;
    font-size: 24px;
    line-height: 28px;
    color: #efa216;
    margin-top: 25px;
  }

  img {
    width: 240px;
    align-self: center;
  }

  form {
    display: flex;
    flex-direction: column;
  }
`
export const Label = styled.p`
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: #efa216;
  margin-top: ${props => (props.error ? '10px' : '28px')};
  margin-bottom: 5px;
`
export const Input = styled.input`
  width: 391.42px;
  height: 40px;
  box-shadow: 3px 3px 10px rgba(74, 144, 226, 0.19);
  border-radius: 5px;
  border: ${props => (props.error ? '2px solid #CC1717;' : 'none')};
  padding-left: 5px;
  color: #cc1717;
`
export const ErrorMessage = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 21px;
  color: #cc1717;
`

export const SignUpLink = styled.p`
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 16px;
  color: #efa216;
  margin-top: 25px;

  a {
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: #cc1717;
    }

    &:active {
      opacity: 0.6;
    }
  }
`
export const Dev = styled.p`
  color: #efa216;
  position: absolute;
  left: auto;
  bottom: 5px;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  cursor: pointer;

  &:hover {
    scale: 1.5;
  }

  &:active {
    opacity: 0.6;
  }
`
