import holidays
from datetime import date
import calendar

def calcular_dias_uteis(ano: int, mes: int, estado: str = 'SP'):
    """Calcula os dias úteis e a quantidade de feriados em dias de semana do mês."""
    feriados = holidays.BR(years=ano, subdiv=estado)
    num_dias = calendar.monthrange(ano, mes)[1]
    
    dias_uteis = 0
    feriados_em_dias_uteis = 0
    
    for dia in range(1, num_dias + 1):
        data_atual = date(ano, mes, dia)
        # 0=Segunda, 1=Terça ... 4=Sexta, 5=Sábado, 6=Domingo
        if data_atual.weekday() < 5: 
            if data_atual in feriados:
                feriados_em_dias_uteis += 1
            else:
                dias_uteis += 1
                
    return dias_uteis, feriados_em_dias_uteis