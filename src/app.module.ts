import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { VentaModule } from './venta/venta.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { CategoriaModule } from './categoria/categoria.module';
import { VentaProductoModule } from './venta-producto/venta-producto.module';
import { EntregaStockModule } from './entrega-stock/entrega-stock.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SucursalesModule } from './sucursales/sucursales.module';
import { TransferenciaProductoModule } from './transferencia-producto/transferencia-producto.module';
import { GatewayModule } from './web-sockets/websocket.module';
import { NotificationModule } from './notification/notification.module';
import { PriceRequestModule } from './price-request/price-request.module';
import { SolicitudTransferenciaProductoModule } from './solicitud-transferencia-producto/solicitud-transferencia-producto.module';
import { AjusteStockModule } from './ajuste-stock/ajuste-stock.module';
import { ProductRemoveModule } from './product-remove/product-remove.module';
import { ClientRemoveModule } from './client-remove/client-remove.module';
import { StockRemoveModule } from './stock-remove/stock-remove.module';
import { ClientModule } from './client/client.module';
import { WarrantyModule } from './warranty/warranty.module';
import { TicketModule } from './ticket/ticket.module';
import { VencimientosModule } from './vencimientos/vencimientos.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsModule } from './reports/reports.module';
import { SucursalSaldoModule } from './sucursal-saldo/sucursal-saldo.module';
import { CajaModule } from './caja/caja.module';
import { SaleDeletedModule } from './sale-deleted/sale-deleted.module';
import { CuotasModule } from './cuotas/cuotas.module';
import { RepairModule } from './repair/repair.module';
import { MetasModule } from './metas/metas.module';
// import { EmpresaModule } from './crm/empresa/empresa.module';
import { EmpresaModule } from './CRM/empresa/empresa.module';
import { SalesSummaryModule } from './sales-summary/sales-summary.module';
import { PurchaseRequisitionsModule } from './compras-requisiciones/purchase-requisitions.module';
import { MinimunStocksModule } from './minimun-stocks/minimun-stocks.module';
import { MinimunStockAlertModule } from './minimun-stock-alert/minimun-stock-alert.module';
import { ImagenesProductoModule } from './imagenes-producto/imagenes-producto.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CloudinaryProvider } from './cloudinary/cloudinaryConfig';
import { RequisicionModule } from './requisicion/requisicion.module';
import { HistorialStockTrackerModule } from './historial-stock-tracker/historial-stock-tracker.module';
import { RecepcionRequisicionesModule } from './recepcion-requisiciones/recepcion-requisiciones.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { HistorialStockModule } from './historial-stock/historial-stock.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { MovimientoCajaModule } from './movimiento-caja/movimiento-caja.module';
import { CajaRegistrosModule } from './caja-registros/caja-registros.module';
import { MovimientosCajasModule } from './movimientos-cajas/movimientos-cajas.module';
import { ResumenDiaModule } from './resumen-dia/resumen-dia.module';
import { MovimientoFinancieroModule } from './movimiento-financiero/movimiento-financiero.module';
import { CuentasBancariasModule } from './cuentas-bancarias/cuentas-bancarias.module';
import { ResumenesAdminModule } from './resumenes-admin/resumenes-admin.module';
import { CronSnapshootModule } from './cron-snapshoot/cron-snapshoot.module';
import { SaldosServiceService } from './crion-snapshoot/saldos-service/saldos-service.service';
import { CajaAdministrativoModule } from './caja-administrativo/caja-administrativo.module';
import { PresentacionProductoModule } from './presentacion-producto/presentacion-producto.module';
import { InventarioPresentacionModule } from './inventario-presentacion/inventario-presentacion.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StockPresentacionModule } from './stock-presentacion/stock-presentacion.module';
import { ComprasModule } from './compras/compras.module';
import { RecepcionesModule } from './compras/recepciones/recepciones.module';
import { StockThresholdPresentacionModule } from './stock-threshold-presentacion/stock-threshold-presentacion.module';
import { ImagenesPresentacionesModule } from './imagenes-presentaciones/imagenes-presentaciones.module';
import { CreditosVentaSolicitudesModule } from './creditos-venta-solicitudes/creditos-venta-solicitudes.module';
import { CreditoModule } from './credito/credito.module';
import { CreditoAutorizationModule } from './credito-autorization/credito-autorization.module';
import { CreditoCuotaModule } from './credito-cuota/credito-cuota.module';
import { AbonoCuotaModule } from './abono-cuota/abono-cuota.module';
import { TipoPresentacionModule } from './tipo-presentacion/tipo-presentacion.module';
import { CuotasMoraCronModule } from './cuotas-mora-cron/cuotas-mora-cron.module';
import { ProrrateoModule } from './prorrateo/prorrateo.module';
import { PayloadProductosModuleModule } from './payload-productos-module/payload-productos-module.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    ProductsModule,
    StockModule,
    VentaModule,
    ProveedorModule,
    CategoriaModule,
    VentaProductoModule,
    EntregaStockModule,
    AnalyticsModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigService esté disponible en toda la aplicación
    }),
    SucursalesModule,
    TransferenciaProductoModule,
    //SOCKETSSSSSS
    GatewayModule,
    NotificationModule,
    PriceRequestModule,
    SolicitudTransferenciaProductoModule,
    AjusteStockModule,
    ProductRemoveModule,
    ClientRemoveModule,
    StockRemoveModule,
    ClientModule,
    WarrantyModule,
    TicketModule,
    VencimientosModule,
    ScheduleModule.forRoot(),
    ReportsModule,
    SucursalSaldoModule,
    CajaModule,
    SaleDeletedModule,
    CuotasModule,
    RepairModule,
    MetasModule,
    EmpresaModule,
    SalesSummaryModule,
    PurchaseRequisitionsModule,
    MinimunStocksModule,
    MinimunStockAlertModule,
    ImagenesProductoModule,
    CloudinaryModule,
    RequisicionModule,
    HistorialStockTrackerModule,
    RecepcionRequisicionesModule,
    UtilitiesModule,
    HistorialStockModule,
    PedidosModule,
    MovimientoCajaModule,
    CajaRegistrosModule,
    MovimientosCajasModule,
    ResumenDiaModule,
    MovimientoFinancieroModule,
    CuentasBancariasModule,
    ResumenesAdminModule,
    CronSnapshootModule,
    CajaAdministrativoModule,
    PresentacionProductoModule,
    InventarioPresentacionModule,
    RealtimeModule,
    StockPresentacionModule,
    ComprasModule,
    RecepcionesModule,
    StockThresholdPresentacionModule,
    ImagenesPresentacionesModule,
    CreditosVentaSolicitudesModule,
    CreditoModule,
    CreditoAutorizationModule,
    CreditoCuotaModule,
    AbonoCuotaModule,
    TipoPresentacionModule,
    CuotasMoraCronModule,
    ProrrateoModule,
    PayloadProductosModuleModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryProvider, SaldosServiceService],
})
export class AppModule {}
