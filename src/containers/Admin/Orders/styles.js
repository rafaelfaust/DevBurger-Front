import ReactSelect from 'react-select'
import styled from 'styled-components'

export const Container = styled.div`
  background: #efefef;
  min-height: 100vh;
  margin-right: 20px;
`
export const ImageProduct = styled.img`
  width: 50px;
  border-radius: 5px;
`
export const Select = styled(ReactSelect)`
  width: 250px;

  .css-13cymwt-control {
    cursor: pointer;
  }
`
export const Menu = styled.div`
  display: flex;
  gap: 50px;
  justify-content: center;
  margin: 20px;
`
export const LinkMenu = styled.a`
  color: #323d5d;
  cursor: pointer;
  font-weight: ${props => (props.isActiveStatus ? 'bold' : '300')};
  border-bottom: ${props =>
    props.isActiveStatus ? '2px Solid #efa216 ' : '400'};
  padding: 20px 0;
`
