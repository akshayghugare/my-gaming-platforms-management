import type { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Unauthorized from '@/pages/Unauthorized';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import UserTableList from '@/pages/user/UserTableList';
import NotFound from '@/pages/NotFound';
import ResetPassword from '@/pages/ResetPassword';
import RoleTableList from '@/pages/role/RoleTableList';
import PublicRoute from './PublicRoute';
import UserLogTableList from '@/pages/userLog/UserLogTableList';
import SystemSettings from '@/pages/systemSettings/SystemSettings';
import ProfilePage from '@/pages/profiles/ProfilePage';
import TagsGamifications from '@/pages/tagsGamification/TagsGamifications';
import CrmTags from '@/pages/crmTags/CrmTags';
import MediaDatabase from '@/pages/mediaDatabase/MediaDatabase';
import CasinoCatalogPage from '@/pages/casinoCatalog/CasinoCatalogPage';
import SportsCatalogPage from '@/pages/sportsCatalog/SportsCatalogPage';
import HttpDebuggerConsolePage from '@/pages/httpDebugerConsole/HttpDebuggerConsolePage';
import CampaignTableList from '@/pages/campaign/CampaignTableList';
import CampaignArchive from '@/pages/campaign/CampaignArchive';
import CreateCampaign from '@/pages/campaign/CreateCampaign';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import SegmentTableList from '@/pages/segment/SegmentTableList';
import SegmentArchive from '@/pages/segment/SegmentArchive';
import CreateSegment from '@/pages/segment/CreateSegment';
import TemplateTableList from '@/pages/template/TemplateTableList';
import TemplateArchive from '@/pages/template/TemplateArchive';
import CreateTemplate from '@/pages/template/CreateTemplate';
import CustomTriggerTableList from '@/pages/customTrigger/CustomTriggerTableList';
import CustomTriggerArchive from '@/pages/customTrigger/CustomTriggerArchive';
import CreateCustomTrigger from '@/pages/customTrigger/CreateCustomTrigger';
import FrequencyCapTableList from '@/pages/frequencyCap/FrequencyCapTableList';
import UnsubscribeReportList from '@/pages/unsubscribeReport/UnsubscribeReportList';
import PlayerDataPage from '@/pages/playerData/PlayerDataPage';
import DocumentationPage from '@/pages/documentation/DocumentationPage';
// Gamification — each module owns its own list / archive / create pages.
import MissionsTableList from '@/pages/gamification/missions/MissionsTableList';
import MissionsArchive from '@/pages/gamification/missions/MissionsArchive';
import CreateMission from '@/pages/gamification/missions/CreateMission';
import MissionBundlesTableList from '@/pages/gamification/missionBundles/MissionBundlesTableList';
import MissionBundlesArchive from '@/pages/gamification/missionBundles/MissionBundlesArchive';
import CreateMissionBundle from '@/pages/gamification/missionBundles/CreateMissionBundle';
import RanksTableList from '@/pages/gamification/ranks/RanksTableList';
import RanksArchive from '@/pages/gamification/ranks/RanksArchive';
import CreateRank from '@/pages/gamification/ranks/CreateRank';
import BonusesView from '@/pages/gamification/bonuses/BonusesView';
import TokenRulesCasinoTableList from '@/pages/gamification/tokenRulesCasino/TokenRulesCasinoTableList';
import TokenRulesCasinoArchive from '@/pages/gamification/tokenRulesCasino/TokenRulesCasinoArchive';
import CreateTokenRuleCasino from '@/pages/gamification/tokenRulesCasino/CreateTokenRuleCasino';
import TokenRulesSportsTableList from '@/pages/gamification/tokenRulesSports/TokenRulesSportsTableList';
import TokenRulesSportsArchive from '@/pages/gamification/tokenRulesSports/TokenRulesSportsArchive';
import CreateTokenRuleSport from '@/pages/gamification/tokenRulesSports/CreateTokenRuleSport';
import XpPointRulesCasinoTableList from '@/pages/gamification/xpPointRulesCasino/XpPointRulesCasinoTableList';
import XpPointRulesCasinoArchive from '@/pages/gamification/xpPointRulesCasino/XpPointRulesCasinoArchive';
import CreateXpPointRuleCasino from '@/pages/gamification/xpPointRulesCasino/CreateXpPointRuleCasino';
import XpPointRulesSportsTableList from '@/pages/gamification/xpPointRulesSports/XpPointRulesSportsTableList';
import XpPointRulesSportsArchive from '@/pages/gamification/xpPointRulesSports/XpPointRulesSportsArchive';
import CreateXpPointRuleSport from '@/pages/gamification/xpPointRulesSports/CreateXpPointRuleSport';
import PlayerCategoriesTableList from '@/pages/gamification/playerCategories/PlayerCategoriesTableList';
import PlayerCategoriesArchive from '@/pages/gamification/playerCategories/PlayerCategoriesArchive';
import CreatePlayerCategory from '@/pages/gamification/playerCategories/CreatePlayerCategory';
import RewardShopTableList from '@/pages/gamification/rewardShop/RewardShopTableList';
import RewardShopArchive from '@/pages/gamification/rewardShop/RewardShopArchive';
import CreateRewardShopProduct from '@/pages/gamification/rewardShop/CreateRewardShopProduct';
import PrizesharkCatalogTableList from '@/pages/gamification/prizesharkCatalog/PrizesharkCatalogTableList';
import PurchaseFeedTableList from '@/pages/gamification/purchaseFeed/PurchaseFeedTableList';
import PurchaseFeedArchive from '@/pages/gamification/purchaseFeed/PurchaseFeedArchive';
import CreatePurchaseFeedEntry from '@/pages/gamification/purchaseFeed/CreatePurchaseFeedEntry';
import TournamentsTableList from '@/pages/gamification/tournaments/TournamentsTableList';
import TournamentsArchive from '@/pages/gamification/tournaments/TournamentsArchive';
import CreateTournament from '@/pages/gamification/tournaments/CreateTournament';
import PlayerTableList from '@/pages/players/PlayerTableList';
import PlayerProfilePage from '@/pages/players/PlayerProfilePage';
import ClientsPage from '@/pages/client/ClientsPage';
import WidgetView from '@/pages/widget/WidgetView';
import WidgetSetupPage from '@/pages/widgetSetup/WidgetSetupPage';
import WidgetEditorPage from '@/pages/widgetSetup/WidgetEditorPage';

const PageRoutes: FC = () => {
  return (
    <Routes>
      {/* Embeddable iframe widgets — fully public, no admin layout or login.
          Hit as /widget/<type>?clientId=&authKey=&email= from external sites. */}
      <Route path="/widget/:type" element={<WidgetView />} />

      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documentation" element={<DocumentationPage />} />

        {/* Players */}
        <Route path="/players" element={<PlayerTableList />} />
        <Route path="/players/:id" element={<PlayerProfilePage />} />

        {/* CRM Routes */}
        <Route path="/crm" element={<Navigate to="/crm/campaigns" replace />} />
        <Route path="/crm/campaigns" element={<CampaignTableList />} />
        <Route path="/crm/campaigns/archive" element={<CampaignArchive />} />
        <Route path="/crm/campaigns/create" element={<CreateCampaign />} />
        <Route path="/crm/analytics" element={<AnalyticsPage />} />
        <Route path="/crm/segments" element={<SegmentTableList />} />
        <Route path="/crm/segments/archive" element={<SegmentArchive />} />
        <Route path="/crm/segments/create" element={<CreateSegment />} />
        <Route path="/crm/templates" element={<TemplateTableList />} />
        <Route path="/crm/templates/archive" element={<TemplateArchive />} />
        <Route path="/crm/templates/create" element={<CreateTemplate />} />
        <Route path="/crm/custom-triggers" element={<CustomTriggerTableList />} />
        <Route path="/crm/custom-triggers/archive" element={<CustomTriggerArchive />} />
        <Route path="/crm/custom-triggers/create" element={<CreateCustomTrigger />} />
        <Route path="/crm/frequency-cap" element={<FrequencyCapTableList />} />
        <Route path="/crm/unsubscribe-reports" element={<UnsubscribeReportList />} />
        <Route path="/crm/player-data" element={<PlayerDataPage />} />

        {/* Gamification */}
        <Route path="/gamification" element={<Navigate to="/gamification/missions" replace />} />

        <Route path="/gamification/missions" element={<MissionsTableList />} />
        <Route path="/gamification/missions/archive" element={<MissionsArchive />} />
        <Route path="/gamification/missions/create" element={<CreateMission />} />

        <Route path="/gamification/mission-bundles" element={<MissionBundlesTableList />} />
        <Route path="/gamification/mission-bundles/archive" element={<MissionBundlesArchive />} />
        <Route path="/gamification/mission-bundles/create" element={<CreateMissionBundle />} />

        <Route path="/gamification/ranks" element={<RanksTableList />} />
        <Route path="/gamification/ranks/archive" element={<RanksArchive />} />
        <Route path="/gamification/ranks/create" element={<CreateRank />} />

        <Route path="/gamification/bonuses" element={<BonusesView />} />

        <Route path="/gamification/token-rules-casino" element={<TokenRulesCasinoTableList />} />
        <Route
          path="/gamification/token-rules-casino/archive"
          element={<TokenRulesCasinoArchive />}
        />
        <Route path="/gamification/token-rules-casino/create" element={<CreateTokenRuleCasino />} />

        <Route path="/gamification/token-rules-sports" element={<TokenRulesSportsTableList />} />
        <Route
          path="/gamification/token-rules-sports/archive"
          element={<TokenRulesSportsArchive />}
        />
        <Route path="/gamification/token-rules-sports/create" element={<CreateTokenRuleSport />} />

        <Route
          path="/gamification/xp-point-rules-casino"
          element={<XpPointRulesCasinoTableList />}
        />
        <Route
          path="/gamification/xp-point-rules-casino/archive"
          element={<XpPointRulesCasinoArchive />}
        />
        <Route
          path="/gamification/xp-point-rules-casino/create"
          element={<CreateXpPointRuleCasino />}
        />

        <Route
          path="/gamification/xp-point-rules-sports"
          element={<XpPointRulesSportsTableList />}
        />
        <Route
          path="/gamification/xp-point-rules-sports/archive"
          element={<XpPointRulesSportsArchive />}
        />
        <Route
          path="/gamification/xp-point-rules-sports/create"
          element={<CreateXpPointRuleSport />}
        />

        <Route path="/gamification/player-categories" element={<PlayerCategoriesTableList />} />
        <Route
          path="/gamification/player-categories/archive"
          element={<PlayerCategoriesArchive />}
        />
        <Route path="/gamification/player-categories/create" element={<CreatePlayerCategory />} />

        <Route path="/gamification/reward-shop" element={<RewardShopTableList />} />
        <Route path="/gamification/reward-shop/archive" element={<RewardShopArchive />} />
        <Route path="/gamification/reward-shop/create" element={<CreateRewardShopProduct />} />

        <Route path="/gamification/prizeshark-catalog" element={<PrizesharkCatalogTableList />} />

        <Route path="/gamification/purchase-feed" element={<PurchaseFeedTableList />} />
        <Route path="/gamification/purchase-feed/archive" element={<PurchaseFeedArchive />} />
        <Route path="/gamification/purchase-feed/create" element={<CreatePurchaseFeedEntry />} />

        <Route path="/gamification/tournaments" element={<TournamentsTableList />} />
        <Route path="/gamification/tournaments/archive" element={<TournamentsArchive />} />
        <Route path="/gamification/tournaments/create" element={<CreateTournament />} />

        {/* Settings routes */}
        <Route path="/settings" element={<Navigate to="/settings/users" replace />} />
        <Route path="/settings/users" element={<UserTableList />} />
        <Route path="/settings/user-logs" element={<UserLogTableList />} />
        <Route path="/settings/roles" element={<RoleTableList />} />
        <Route path="/settings/system-settings" element={<SystemSettings />} />
        <Route path="/settings/tags-gamification" element={<TagsGamifications />} />
        <Route path="/settings/tags-crm" element={<CrmTags />} />
        <Route path="/settings/media-database" element={<MediaDatabase />} />
        <Route path="/settings/casino-catalog" element={<CasinoCatalogPage />} />
        <Route path="/settings/sports-catalog" element={<SportsCatalogPage />} />
        <Route path="/settings/http-debugger-console" element={<HttpDebuggerConsolePage />} />
        <Route path="/settings/widget-setup" element={<WidgetSetupPage />} />
        <Route path="/settings/widget-setup/create" element={<WidgetEditorPage />} />
        <Route path="/settings/widget-setup/:id/edit" element={<WidgetEditorPage />} />

        {/* Configurations */}
        <Route path="/configurations" element={<Navigate to="/configurations/clients" replace />} />
        <Route path="/configurations/clients" element={<ClientsPage />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default PageRoutes;
