import {
  faCartArrowDown,
  faCartPlus,
  faCartShopping
} from '@fortawesome/free-solid-svg-icons'

import paths from '../../constants/paths'

const listLinks = [
  {
    id: 1,
    label: 'Pedidos',
    link: paths.Order,
    icon: faCartArrowDown
  },
  {
    id: 2,
    label: 'Produtos',
    link: paths.Products,
    icon: faCartShopping
  },
  {
    id: 3,
    label: 'Adicionar Produto',
    link: paths.NewProduct,
    icon: faCartPlus
  }
]

export default listLinks
