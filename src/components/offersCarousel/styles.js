import styled from 'styled-components'

export const Container = styled.div`
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 35px;
  padding: 35px 0;

  .rec.rec-arrow {
    background-color: #efa216;
    color: #cc1717;
    border: solid 1px #efa216;
    box-shadow: inset 0 0 0 50px #efa216;
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  }

  .rec.rec-arrow:hover {
    color: #efa216;
    background: transparent;
    box-shadow: inset 0 0 0 0 #efa216;
    border-color: #efa216;
  }

  .rec.rec-arrow:disabled {
    border: none;
    background: #bebebf;
    color: #efefef;
  }

  .rec.rec-arrow:active {
    border: solid 1px #cc1717;
    color: #cc1717;
  }

  .rec.rec-dot {
    display: none;
  }
  .rec.rec-dot_active {
    display: none;
  }
`
export const H1 = styled.h1`
  font-style: bold;
  font-weight: 900;
  font-size: 60px;
  line-height: 120%;
  color: #efa216;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
`

export const OffersImg = styled.img``

export const ContainerItems = styled.div`
  display: flex;
  flex-direction: column;

  p {
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    line-height: 24px;
    color: #424242;
  }
`

export const Image = styled.img`
  width: 200px;
  border-radius: 12px;
  margin-bottom: 16px;
`

export const Button = styled.button`
  margin-top: 12px;
  border-radius: 10px;
  height: 40px;
  border: none;
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  cursor: pointer;
  transition: 0.5s;
  color: #cc1717;
  background: #efa216;
  box-shadow: inset 0 0 0 50px #efa216;
  border: solid 1px #efa216;

  &:hover {
    color: #efa216;
    background: transparent;
    box-shadow: inset 0 0 0 0 #efa216;
    border-color: #efa216;
  }
  &:active {
    border: solid 1px #cc1717;
    color: #cc1717;
  }
`
