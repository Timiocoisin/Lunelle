'use strict';
function description(code) {
  if (code === 0) return '晴'; if (code <= 3) return '多云'; if (code <= 48) return '有雾';
  if (code <= 67) return '雨'; if (code <= 77) return '雪'; if (code <= 86) return '阵雨 / 雪';
  return '雷雨';
}
class Weather {
  constructor(fetcher = fetch) { this.fetcher = fetcher; this.cache = null; }
  async json(url) {
    const response = await this.fetcher(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('天气服务暂时不可用');
    return response.json();
  }
  async read(city) {
    if (this.cache?.city === city && Date.now() - this.cache.at < 600000) return this.cache;
    // Built-in city coordinates avoid ambiguous "Zhongshan" geocoding. No GPS/IP lookup.
    let place = city === '中山' ? { latitude: 22.5176, longitude: 113.3928, name: '广东 · 中山' } : null;
    if (!place) {
      const geo = await this.json('https://geocoding-api.open-meteo.com/v1/search?count=1&language=zh&name=' + encodeURIComponent(city));
      place = geo.results?.[0]; if (!place) throw new Error('未找到城市，请填写更完整的城市名');
    }
    const data = await this.json(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`);
    const temperature = data.current?.temperature_2m;
    if (!Number.isFinite(temperature)) throw new Error('天气服务未提供温度');
    return this.cache = { city, label: place.name, temperature, text: description(data.current.weather_code), at: Date.now(), source: 'Open-Meteo' };
  }
}
module.exports = { Weather, description };
