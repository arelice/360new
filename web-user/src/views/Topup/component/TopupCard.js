import { Typography, Stack, OutlinedInput, InputAdornment, Button, InputLabel,
   FormControl,Modal,Box,useMediaQuery ,Select ,MenuItem } from '@mui/material';
import { IconWallet } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import SubCard from 'ui-component/cards/SubCard';
import UserCard from 'ui-component/cards/UserCard';

import { API } from 'utils/api';
import React, { useEffect, useState } from 'react';
import { showError, showInfo, showSuccess, renderQuota } from 'utils/common';

const TopupCard = () => {
  const theme = useTheme();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpLink, setTopUpLink] = useState('');
  const [zfb, setZfb] = useState('');
  const [wx, setWx] = useState('');
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topUpCount, setTopUpCount] = useState(10); 
  const [amount, setAmount] = useState(0.0); 
  const [open, setOpen] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [topUpCode, setTopUpCode] = useState(''); 
  const isMobile = useMediaQuery('(max-width:600px)');
  const [topUpDays, setTopUpDays] = useState(''); // 默认充值天数
  const [paymentMultiplier, setPaymentMultiplier] = useState({}); 
  const [topupAmountEnabled, setTopupAmountEnabled] = useState('');
  const [topupAmount, setTopupAmount] = useState({}); 

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo('请输入充值码！');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess('充值成功！');
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError('请求失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError('超级管理员未设置充值链接！');
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/user/self`);
    
    const {success, message, data} = res.data;
    if (success) {
        setUserQuota(data.quota);
    } else {
        showError(message);
    }
  }

  const [options, setOptions] = useState({});

  const getOptions = async () => {
    const res = await API.get('/api/user/option');
    const { success, message, data } = res.data;
    if (success) {
      let newOptions = {};
      data.forEach((item) => {
        newOptions[item.key] = item.value;
      });
      
      setOptions(newOptions); // 设置所有选项的状态
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getUserQuota().then();
    getOptions();
  }, []);

  useEffect(() => {
    if (options.TopUpLink) { 
      setTopUpLink(options.TopUpLink);
    }
    if (options.YzfWx) { 
      setWx(options.YzfWx);
    }
    if (options.YzfZfb) { 
      setZfb(options.YzfZfb);
    }
    if (options.TopupAmountEnabled) { 
      setTopupAmountEnabled(options.TopupAmountEnabled);
    }
    if (options.TopupAmount) {
      const parsedAmount = JSON.parse(options.TopupAmount);
      setTopupAmount(parsedAmount);
    }
    if (options.TopupRatio) {
      const parsedRatio = JSON.parse(options.TopupRatio);
      setPaymentMultiplier(parsedRatio);
    }
  }, [options]);
  

  useEffect(() => {
    if (open) { 
      updateActualAmount();
    }
  }, [topUpDays, open]);

  
  const updateActualAmount = () => {

    return getAmount(topUpCount); 
  };
  
  const preTopUp = async (payment) => {
    setPayWay(payment);
    
    const firstDayOption = Object.keys(paymentMultiplier)[0];
    setTopUpDays(firstDayOption, async () => {
      await updateActualAmount();
    });

    setOpen(true);
  };
  
  
  
  const onlineTopUp = async () => {
    if (amount === 0) {
      await getAmount();
  }
    setOpen(false);
    try {
        const res = await API.post('/api/user/pay', {
            amount: parseInt(topUpCount),
            top_up_code: topUpCode, 
            payment_method: payWay,
            top_up_days: parseInt(topUpDays),
            topup_ratio: topUpDays 
        });
        if (res !== undefined) {
            const {message, data} = res.data;
            // showInfo(message);
            if (message === 'success') {

                let params = data
                let url = res.data.url
                let form = document.createElement('form')
                form.action = url
                form.method = 'POST'
                // 判断是否为safari浏览器
                let isSafari = navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") < 1;
                if (!isSafari) {
                    form.target = '_blank'
                }
                for (let key in params) {
                    let input = document.createElement('input')
                    input.type = 'hidden'
                    input.name = key
                    input.value = params[key]
                    form.appendChild(input)
                }
                document.body.appendChild(form)
                form.submit()
                document.body.removeChild(form)
            } else {
                showError(data);
                // setTopUpCount(parseInt(res.data.count));
                // setAmount(parseInt(data));
            }
        } else {
            showError(res);
        }
    } catch (err) {
      showError('请求失败');
      console.error(err); // 输出错误到控制台
    }
  };

  
  const renderAmount = () => {
    return amount + '元';
  };


  const getAmount = async (value = topUpCount) => {
    const intValue = parseInt(value, 10);
    if (isNaN(intValue) || intValue.toString() !== value.toString()) {
      showError('请输入有效的整数金额！');
      return;
    }
    try {
        const res = await API.post('/api/user/amount', {
            amount: parseFloat(value),
            topup_ratio: topUpDays ,
            
            top_up_code: setTopUpCode 
        });
        if (res !== undefined) {
            const {message, data} = res.data;
            // showInfo(message);
            if (message === 'success') {
                setAmount(parseFloat(data));
            } else {
                showError(data);
            }
        } else {
            showError(res);
        }
    } catch (err) {
      showError('请求失败');
    } 
  };

  const renderTopUpAmountInput = () => {
    // 定义输入组件
    const amountInputComponent = topupAmountEnabled === "true" ? (
      <Select
        labelId="top-up-amount-select-label"
        id="top-up-amount-select"
        value={topUpCount}
        label="充值金额"
        onChange={(e) => {
          setTopUpCount(e.target.value);
          getAmount(e.target.value);
        }}
        fullWidth
      >
        {Object.entries(topupAmount).map(([key, value]) => {
          // 转换折扣值为百分比形式，然后转为整数
          const discountRate = Math.round(value * 100);
          let discountText = `${discountRate}%折`; // 默认显示为百分比折扣
          
          if (discountRate === 100) {
            // 如果折扣率为100%，则表示无折扣
            discountText = '无折扣';
          } else if (discountRate > 0) {
            // 如果折扣率为其他值，显示为X折
            discountText = `${discountRate / 10}折`;
          }
          
          return (
            <MenuItem key={key} value={key}>{key} - {discountText}</MenuItem>
          );
        })}

      </Select>
    ) : (
      <OutlinedInput
        id="amount"
        label="充值金额"
        type="text"
        value={topUpCount}
        onChange={(e) => {
          const newValue = e.target.value;
          if (/^\d*$/.test(newValue)) {
            setTopUpCount(newValue);
            getAmount(newValue);
          }
        }}
        startAdornment={<InputAdornment position="start">$</InputAdornment>}
        fullWidth
      />
    );
  
    // 定义支付按钮
    const paymentButtons = (
      <>
        {zfb === 'true' && (
          <Button variant="contained" onClick={() => preTopUp('zfb')} sx={{ ml: 1 }}>
            支付宝
          </Button>
        )}
        {wx === 'true' && (
          <Button variant="contained" onClick={() => preTopUp('wx')} sx={{ ml: 1 }}>
            微信
          </Button>
        )}
      </>
    );
  
    // 根据当前设备调整布局
    return (
      <FormControl fullWidth variant="outlined" sx={{ mt: 2, mb: 1 }}>
        <InputLabel htmlFor="amount">充值金额</InputLabel>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            {amountInputComponent}
          </Box>
          {!isMobile && paymentButtons}
        </Box>
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            {paymentButtons}
          </Box>
        )}
      </FormControl>
    );
  };
  


  // 在组件的顶部添加style定义（如果您有单独的样式文件，请将它们放在那里）
  const optionButtonStyle = {
    my: 1, // margin top & bottom
    mx: 0.5, // margin left & right
  };

  // 弹窗内容
  const renderModalContent = () => (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      borderRadius: 1,
    }}>
      <Typography sx={{ mt: 2 }}>充值金额：{topUpCount}$</Typography>
      <Typography sx={{ mt: 2 }}>实付金额：{renderAmount()}</Typography>

      {/* 显示所有充值天数及其对应倍率 */}
      <Stack spacing={1} direction="column" sx={{ mt: 2 }}>
      {Object.entries(paymentMultiplier).map(([days, multiplier]) => (
        <Button
          key={days}
          variant={topUpDays === days ? "contained" : "outlined"}
          onClick={() => {
            setTopUpDays(days); 
          }}
          sx={optionButtonStyle}
        >
          {days === "-1" ? `永不过期 - ${multiplier}x` : `有效期：${days} 天 - ${multiplier}x`}
        </Button>
      ))}
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={() => setOpen(false)} color="error">取消</Button>
        <Button onClick={() => onlineTopUp()} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? '处理中...' : '确认充值'}
        </Button>
      </Stack>
    </Box>
  );

  return (
    <UserCard>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} paddingTop={'20px'}>
        <IconWallet color={theme.palette.primary.main} />
        <Typography variant="h4">当前额度:</Typography>
        <Typography variant="h4">{renderQuota(userQuota)}</Typography>
      </Stack>
      <SubCard
        sx={{
          marginTop: '40px'
        }}
      >
        <SubCard sx={{ marginTop: '40px' }}>
        {renderTopUpAmountInput()} {/* 微信和支付宝充值模块 */}
        </SubCard>
        {topUpLink && (
          <SubCard sx={{ marginTop: '40px' }}>
            <Stack justifyContent="center" alignItems={'center'} spacing={3} paddingTop={'20px'}>
              <Typography variant={'h4'} color={theme.palette.grey[700]}>
                 充值方法二：商店获取兑换码，粘贴到下面的输入框，再点击兑换即可获得余额
              </Typography>
              <Button variant="contained" onClick={openTopUpLink}>
                兑换码商店
              </Button>
            </Stack>
          </SubCard>
        )}
        <SubCard sx={{ marginTop: '40px' }}>
        <FormControl fullWidth variant="outlined" sx={{ mt: 2, mb: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              alignItems: 'center',
              gap: isMobile ? 2 : 1, // 在移动设备上增加垂直间距，在桌面上增加水平间距
            }}
          >
            <OutlinedInput
              id="key"
              label="兑换码"
              type="text"
              value={redemptionCode}
              onChange={(e) => {
                setRedemptionCode(e.target.value);
              }}
              name="key"
              placeholder="请输入兑换码"
              aria-describedby="helper-text-channel-quota-label"
              sx={{ flex: 1, width: 'auto' }} // 确保输入框在行中占据可用空间
            />
            <Button 
              variant="contained" 
              onClick={topUp} 
              disabled={isSubmitting}

            >
              {isSubmitting ? '兑换中...' : '兑换'}
            </Button>
          </Box>
        </FormControl>
        </SubCard>
          <Modal open={open} onClose={() => setOpen(false)}>
            {renderModalContent()}
          </Modal>
      </SubCard>
    </UserCard>
  );
};

export default TopupCard;
