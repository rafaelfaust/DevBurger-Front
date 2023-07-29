import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import PropTypes from 'prop-types'
import React, { useState } from 'react'

import apiDevBurger from '../../../services/api'
import status from './orderStatus'
import { ImageProduct, Select } from './styles'

function Row({ row, orders, setOrders }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function setNewStatus(id, status) {
    setIsLoading(true)
    try {
      await apiDevBurger.put(`orders/${id}`, { status })

      const newOrdes = orders.map(order => {
        return order._id === id ? { ...order, status } : order
      })
      setOrders(newOrdes)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.orderId}
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.date}</TableCell>
        <TableCell>
          <Select
            options={status.filter(sts => sts.value !== 'Todos')}
            menuPortalTarget={document.body}
            placeholder="Status"
            defaultValue={
              status.find(option => option.value === row.status) || null
            }
            onChange={newStatus => {
              setNewStatus(row.orderId, newStatus.value)
            }}
            isLoading={isLoading}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Itens
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="center">Quantidade</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="center">Imagem do Produto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.products.map(productsRow => (
                    <TableRow key={productsRow.id}>
                      <TableCell component="th" scope="row">
                        {productsRow.name}
                      </TableCell>
                      <TableCell align="center">
                        {productsRow.quantity}
                      </TableCell>
                      <TableCell>{productsRow.category}</TableCell>
                      <TableCell align="center">
                        <ImageProduct src={productsRow.url} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}

Row.propTypes = {
  orders: PropTypes.array,
  setOrders: PropTypes.func,
  row: PropTypes.shape({
    name: PropTypes.string.isRequired,
    orderId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    products: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        category: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
}

export default Row
